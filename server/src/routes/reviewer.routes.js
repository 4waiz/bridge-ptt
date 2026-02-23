const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, requireRoles } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { APPLICATION_STATUSES, STATUS_LABELS } = require('../constants/application');

const router = express.Router();

router.use(authenticate, requireRoles('REVIEWER'));

const listQuerySchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  minScore: z.preprocess(
    (value) => (value === undefined || value === '' ? undefined : Number(value)),
    z.number().min(0).optional(),
  ),
  maxScore: z.preprocess(
    (value) => (value === undefined || value === '' ? undefined : Number(value)),
    z.number().min(0).optional(),
  ),
  mustHaveMatch: z.preprocess((value) => {
    if (value === undefined || value === '') {
      return undefined;
    }

    if (value === 'true' || value === true) {
      return true;
    }

    if (value === 'false' || value === false) {
      return false;
    }

    return value;
  }, z.boolean().optional()),
  sort: z.enum(['score_desc', 'score_asc', 'created_desc', 'created_asc']).optional(),
});

const scoresSchema = z.object({
  scores: z
    .array(
      z.object({
        category: z.string().trim().min(1).max(64),
        value: z.number().int().min(1).max(5),
      }),
    )
    .min(1),
});

const noteSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

const statusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
});

function parseApplicationId(idParam) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function averageScore(scores) {
  if (!scores.length) {
    return null;
  }

  const total = scores.reduce((sum, score) => sum + score.value, 0);
  return Number((total / scores.length).toFixed(2));
}

router.get(
  '/applications',
  asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        errors: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { status, minScore, maxScore, mustHaveMatch, sort = 'score_desc' } = parsed.data;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (typeof mustHaveMatch === 'boolean') {
      where.mandatoryMet = mustHaveMatch;
    }

    if (typeof minScore === 'number' || typeof maxScore === 'number') {
      where.score = {};
      if (typeof minScore === 'number') {
        where.score.gte = minScore;
      }
      if (typeof maxScore === 'number') {
        where.score.lte = maxScore;
      }
    }

    const orderByMap = {
      score_desc: { score: 'desc' },
      score_asc: { score: 'asc' },
      created_desc: { createdAt: 'desc' },
      created_asc: { createdAt: 'asc' },
    };

    const applications = await prisma.application.findMany({
      where,
      orderBy: orderByMap[sort],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        scores: {
          select: {
            value: true,
          },
        },
      },
    });

    return res.json({
      applications: applications.map((application) => ({
        id: application.id,
        userId: application.userId,
        fullName: application.fullName,
        email: application.email,
        location: application.location,
        status: application.status,
        statusLabel: STATUS_LABELS[application.status],
        score: application.score,
        mandatoryMet: application.mandatoryMet,
        reviewerAverage: averageScore(application.scores),
        createdAt: application.createdAt,
      })),
    });
  }),
);

router.get(
  '/applications/:id',
  asyncHandler(async (req, res) => {
    const applicationId = parseApplicationId(req.params.id);
    if (!applicationId) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        scores: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
        },
        notes: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        events: {
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const mandatorySelections = (() => {
      try {
        return JSON.parse(application.mandatorySelections);
      } catch (error) {
        return [];
      }
    })();

    const preferredSelections = (() => {
      try {
        return JSON.parse(application.preferredSelections);
      } catch (error) {
        return [];
      }
    })();

    return res.json({
      application: {
        ...application,
        mandatorySelections,
        preferredSelections,
        statusLabel: STATUS_LABELS[application.status],
        reviewerAverage: averageScore(application.scores),
      },
    });
  }),
);

router.post(
  '/applications/:id/scores',
  validateBody(scoresSchema),
  asyncHandler(async (req, res) => {
    const applicationId = parseApplicationId(req.params.id);
    if (!applicationId) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const categories = req.body.scores.map((score) => score.category.toLowerCase());
    if (new Set(categories).size !== categories.length) {
      return res.status(400).json({ message: 'Duplicate score categories are not allowed' });
    }

    const application = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    await prisma.$transaction(async (tx) => {
      for (const scoreInput of req.body.scores) {
        await tx.score.upsert({
          where: {
            applicationId_reviewerId_category: {
              applicationId,
              reviewerId: req.user.id,
              category: scoreInput.category,
            },
          },
          update: {
            value: scoreInput.value,
          },
          create: {
            applicationId,
            reviewerId: req.user.id,
            category: scoreInput.category,
            value: scoreInput.value,
          },
        });
      }

      const actionCategories = req.body.scores.map((score) => score.category).join(', ');
      await tx.eventLog.create({
        data: {
          applicationId,
          actorId: req.user.id,
          action: `Reviewer updated scores (${actionCategories})`,
        },
      });
    });

    return res.status(201).json({ message: 'Scores saved' });
  }),
);

router.post(
  '/applications/:id/notes',
  validateBody(noteSchema),
  asyncHandler(async (req, res) => {
    const applicationId = parseApplicationId(req.params.id);
    if (!applicationId) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const application = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const note = await prisma.note.create({
      data: {
        applicationId,
        reviewerId: req.user.id,
        content: req.body.content,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await prisma.eventLog.create({
      data: {
        applicationId,
        actorId: req.user.id,
        action: 'Reviewer added an internal note',
      },
    });

    return res.status(201).json({ note });
  }),
);

router.patch(
  '/applications/:id/status',
  validateBody(statusSchema),
  asyncHandler(async (req, res) => {
    const applicationId = parseApplicationId(req.params.id);
    if (!applicationId) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const existing = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!existing) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: req.body.status,
      },
    });

    await prisma.eventLog.create({
      data: {
        applicationId,
        actorId: req.user.id,
        action: `Status changed from ${existing.status} to ${req.body.status}`,
      },
    });

    return res.json({
      application: {
        id: updated.id,
        status: updated.status,
        statusLabel: STATUS_LABELS[updated.status],
      },
    });
  }),
);

module.exports = router;
