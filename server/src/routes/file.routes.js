const express = require('express');
const path = require('path');
const fs = require('fs');
const prisma = require('../prisma');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get(
  '/applications/:id/cv',
  authenticate,
  asyncHandler(async (req, res) => {
    const applicationId = Number(req.params.id);
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        userId: true,
        cvPath: true,
      },
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const role = req.user.role;
    if (role === 'APPLICANT' && application.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!['APPLICANT', 'REVIEWER', 'ADMIN'].includes(role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const absolutePath = path.resolve(process.cwd(), application.cvPath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'CV file not found' });
    }

    return res.sendFile(absolutePath);
  }),
);

module.exports = router;
