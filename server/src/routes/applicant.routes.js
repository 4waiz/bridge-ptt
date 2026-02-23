const express = require('express');
const path = require('path');
const { z } = require('zod');
const prisma = require('../prisma');
const asyncHandler = require('../utils/asyncHandler');
const upload = require('../middleware/upload');
const { authenticate, requireRoles } = require('../middleware/auth');
const {
  normalizeIds,
  normalizePreferredSelections,
  computeMandatoryMet,
  computePreferredScore,
  parseJsonField,
} = require('../utils/scoring');
const { STATUS_LABELS } = require('../constants/application');

const router = express.Router();

router.use(authenticate, requireRoles('APPLICANT'));

function serializeApplication(application) {
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

  return {
    id: application.id,
    userId: application.userId,
    status: application.status,
    statusLabel: STATUS_LABELS[application.status],
    score: application.score,
    fullName: application.fullName,
    email: application.email,
    phone: application.phone,
    location: application.location,
    experienceText: application.experienceText,
    mandatoryMet: application.mandatoryMet,
    mandatorySelections,
    preferredSelections,
    cvPath: application.cvPath,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    scores: application.scores,
    notes: application.notes,
    events: application.events,
  };
}

router.get(
  '/criteria',
  asyncHandler(async (_req, res) => {
    const [mustHave, niceToHave] = await Promise.all([
      prisma.criteria.findMany({
        where: { type: 'MUST_HAVE' },
        orderBy: { label: 'asc' },
      }),
      prisma.criteria.findMany({
        where: { type: 'NICE_TO_HAVE' },
        orderBy: { label: 'asc' },
      }),
    ]);

    return res.json({
      criteria: {
        mustHave,
        niceToHave,
      },
    });
  }),
);

router.post(
  '/application',
  upload.single('cv'),
  asyncHandler(async (req, res) => {
    const dataSchema = z.object({
      fullName: z.string().trim().min(2).max(100),
      email: z.email().trim().max(255),
      phone: z.string().trim().min(7).max(30),
      location: z.string().trim().min(2).max(120),
      experienceText: z.string().trim().min(10).max(5000),
    });

    const parsedBody = dataSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        message: 'Invalid application payload',
        errors: parsedBody.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const existingApplication = await prisma.application.findUnique({
      where: { userId: req.user.id },
    });

    if (!req.file && !existingApplication) {
      return res.status(400).json({ message: 'CV file is required' });
    }

    const [mustHaveCriteria, niceToHaveCriteria] = await Promise.all([
      prisma.criteria.findMany({ where: { type: 'MUST_HAVE' } }),
      prisma.criteria.findMany({ where: { type: 'NICE_TO_HAVE' } }),
    ]);

    const mandatoryCriteria = parseJsonField(req.body.mandatoryCriteria, []);
    const preferredCriteria = parseJsonField(req.body.preferredCriteria, []);

    const selectedMandatoryIds = normalizeIds(mandatoryCriteria);
    const normalizedPreferredSelections = normalizePreferredSelections(preferredCriteria);

    const allowedNiceToHaveIds = new Set(niceToHaveCriteria.map((criteria) => criteria.id));
    const hasInvalidPreferredSelection = normalizedPreferredSelections.some(
      (selection) => !allowedNiceToHaveIds.has(selection.criteriaId),
    );

    if (hasInvalidPreferredSelection) {
      return res.status(400).json({ message: 'Preferred criteria contain invalid selections' });
    }

    const mandatoryMet = computeMandatoryMet(selectedMandatoryIds, mustHaveCriteria);
    const score = computePreferredScore(normalizedPreferredSelections, niceToHaveCriteria);

    const nextStatus = mandatoryMet ? 'APPLIED' : 'REJECTED';
    const previousStatus = existingApplication?.status;

    const relativeCvPath = req.file
      ? path.posix.join(process.env.UPLOAD_DIR || 'uploads', req.file.filename)
      : existingApplication.cvPath;

    const payload = {
      fullName: parsedBody.data.fullName,
      email: parsedBody.data.email.toLowerCase(),
      phone: parsedBody.data.phone,
      location: parsedBody.data.location,
      experienceText: parsedBody.data.experienceText,
      mandatoryMet,
      mandatorySelections: JSON.stringify(selectedMandatoryIds),
      preferredSelections: JSON.stringify(normalizedPreferredSelections),
      score,
      status: nextStatus,
      cvPath: relativeCvPath,
    };

    let savedApplication;

    await prisma.$transaction(async (tx) => {
      if (existingApplication) {
        savedApplication = await tx.application.update({
          where: { id: existingApplication.id },
          data: payload,
        });

        await tx.eventLog.create({
          data: {
            applicationId: savedApplication.id,
            actorId: req.user.id,
            action: `Application resubmitted (${previousStatus || 'N/A'} -> ${nextStatus})`,
          },
        });
      } else {
        savedApplication = await tx.application.create({
          data: {
            userId: req.user.id,
            ...payload,
          },
        });

        await tx.eventLog.create({
          data: {
            applicationId: savedApplication.id,
            actorId: req.user.id,
            action: `Application submitted with status ${nextStatus}`,
          },
        });
      }

      if (!mandatoryMet) {
        await tx.eventLog.create({
          data: {
            applicationId: savedApplication.id,
            actorId: req.user.id,
            action: 'Auto rejected: mandatory criteria not met',
          },
        });
      }
    });

    return res.status(existingApplication ? 200 : 201).json({
      message: existingApplication ? 'Application updated' : 'Application submitted',
      application: serializeApplication(savedApplication),
    });
  }),
);

router.get(
  '/application',
  asyncHandler(async (req, res) => {
    const application = await prisma.application.findUnique({
      where: { userId: req.user.id },
      include: {
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
      return res.status(404).json({ message: 'No application found for this account' });
    }

    return res.json({
      application: serializeApplication(application),
    });
  }),
);

module.exports = router;
