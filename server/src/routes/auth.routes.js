const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const asyncHandler = require('../utils/asyncHandler');
const { hashPassword, verifyPassword, signToken } = require('../utils/auth');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');

const router = express.Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().max(255),
  password: z.string().min(4).max(72),
});

const loginSchema = z.object({
  email: z.email().trim().max(255),
  password: z.string().min(1).max(72),
});

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.toLowerCase(),
    createdAt: user.createdAt,
  };
}

router.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await hashPassword(req.body.password);

    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        email,
        password: passwordHash,
        role: 'APPLICANT',
      },
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: toPublicUser(user),
    });
  }),
);

router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValidPassword = await verifyPassword(req.body.password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: toPublicUser(user),
    });
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      user: {
        ...user,
        role: user.role.toLowerCase(),
      },
    });
  }),
);

module.exports = router;
