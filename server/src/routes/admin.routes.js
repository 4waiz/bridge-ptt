const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, requireRoles } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');
const { hashPassword } = require('../utils/auth');

const router = express.Router();

router.use(authenticate, requireRoles('ADMIN'));

const criteriaSchema = z
  .object({
    type: z.enum(['MUST_HAVE', 'NICE_TO_HAVE']),
    label: z.string().trim().min(2).max(255),
    weight: z.number().min(0).max(100).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'NICE_TO_HAVE' && typeof value.weight !== 'number') {
      ctx.addIssue({
        code: 'custom',
        path: ['weight'],
        message: 'Weight is required for NICE_TO_HAVE criteria',
      });
    }
  });

const reviewerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().max(255),
  password: z.string().min(4).max(72),
});

router.get(
  '/dashboard/stats',
  asyncHandler(async (_req, res) => {
    const [
      totalApplicants,
      shortlisted,
      rejected,
      interviewsScheduled,
      hired,
      reviewers,
    ] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({ where: { status: 'SHORTLISTED' } }),
      prisma.application.count({ where: { status: 'REJECTED' } }),
      prisma.application.count({ where: { status: 'INTERVIEW_SCHEDULED' } }),
      prisma.application.count({ where: { status: 'HIRED' } }),
      prisma.user.count({ where: { role: 'REVIEWER' } }),
    ]);

    return res.json({
      stats: {
        totalApplicants,
        shortlisted,
        rejected,
        interviewsScheduled,
        hired,
        reviewers,
      },
    });
  }),
);

router.get(
  '/criteria',
  asyncHandler(async (_req, res) => {
    const criteria = await prisma.criteria.findMany({
      orderBy: [{ type: 'asc' }, { label: 'asc' }],
    });

    return res.json({ criteria });
  }),
);

router.post(
  '/criteria',
  validateBody(criteriaSchema),
  asyncHandler(async (req, res) => {
    const criteria = await prisma.criteria.create({
      data: {
        type: req.body.type,
        label: req.body.label,
        weight: req.body.type === 'NICE_TO_HAVE' ? req.body.weight : null,
      },
    });

    return res.status(201).json({ criteria });
  }),
);

router.put(
  '/criteria/:id',
  validateBody(criteriaSchema),
  asyncHandler(async (req, res) => {
    const criteriaId = Number(req.params.id);
    if (!Number.isInteger(criteriaId) || criteriaId <= 0) {
      return res.status(400).json({ message: 'Invalid criteria id' });
    }

    const criteria = await prisma.criteria.update({
      where: { id: criteriaId },
      data: {
        type: req.body.type,
        label: req.body.label,
        weight: req.body.type === 'NICE_TO_HAVE' ? req.body.weight : null,
      },
    });

    return res.json({ criteria });
  }),
);

router.delete(
  '/criteria/:id',
  asyncHandler(async (req, res) => {
    const criteriaId = Number(req.params.id);
    if (!Number.isInteger(criteriaId) || criteriaId <= 0) {
      return res.status(400).json({ message: 'Invalid criteria id' });
    }

    await prisma.criteria.delete({ where: { id: criteriaId } });

    return res.status(204).send();
  }),
);

router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.json({
      users: users.map((user) => ({
        ...user,
        role: user.role.toLowerCase(),
      })),
    });
  }),
);

router.post(
  '/users/reviewer',
  validateBody(reviewerSchema),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await hashPassword(req.body.password);

    const reviewer = await prisma.user.create({
      data: {
        name: req.body.name,
        email,
        password: passwordHash,
        role: 'REVIEWER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      reviewer: {
        ...reviewer,
        role: reviewer.role.toLowerCase(),
      },
    });
  }),
);

router.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const parsedLimit = Number(req.query.limit);
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 && parsedLimit <= 500 ? parsedLimit : 200;

    const logs = await prisma.eventLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        application: {
          select: {
            id: true,
            fullName: true,
            status: true,
          },
        },
        actor: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          },
        },
      },
    });

    return res.json({ logs });
  }),
);

module.exports = router;
