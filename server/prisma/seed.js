const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function ensureSeedCv(filename, content) {
  const uploadDirName = process.env.UPLOAD_DIR || 'uploads';
  const uploadDir = path.resolve(__dirname, '..', uploadDirName);

  fs.mkdirSync(uploadDir, { recursive: true });

  const targetPath = path.join(uploadDir, filename);
  fs.writeFileSync(targetPath, content, 'utf8');

  return path.posix.join(uploadDirName, filename);
}

async function main() {
  await prisma.eventLog.deleteMany();
  await prisma.note.deleteMany();
  await prisma.score.deleteMany();
  await prisma.application.deleteMany();
  await prisma.criteria.deleteMany();
  await prisma.user.deleteMany();

  const mustHaveCriteria = await Promise.all([
    prisma.criteria.create({
      data: { type: 'MUST_HAVE', label: 'Authorized to work in target region', weight: null },
    }),
    prisma.criteria.create({
      data: { type: 'MUST_HAVE', label: 'Bachelor degree in relevant field', weight: null },
    }),
    prisma.criteria.create({
      data: { type: 'MUST_HAVE', label: 'Available for full-time commitment', weight: null },
    }),
  ]);

  const niceToHaveCriteria = await Promise.all([
    prisma.criteria.create({
      data: { type: 'NICE_TO_HAVE', label: 'React experience', weight: 2.2 },
    }),
    prisma.criteria.create({
      data: { type: 'NICE_TO_HAVE', label: 'Node.js experience', weight: 1.9 },
    }),
    prisma.criteria.create({
      data: { type: 'NICE_TO_HAVE', label: 'Cloud platform experience', weight: 1.5 },
    }),
    prisma.criteria.create({
      data: { type: 'NICE_TO_HAVE', label: 'Stakeholder communication', weight: 1.2 },
    }),
  ]);

  const defaultPasswordHash = await bcrypt.hash('1234', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@system.com',
      password: defaultPasswordHash,
      role: 'ADMIN',
    },
  });

  const reviewer = await prisma.user.create({
    data: {
      name: 'Main Reviewer',
      email: 'reviewer@system.com',
      password: defaultPasswordHash,
      role: 'REVIEWER',
    },
  });

  const applicantOne = await prisma.user.create({
    data: {
      name: 'Alex Applicant',
      email: 'alex@applicant.com',
      password: defaultPasswordHash,
      role: 'APPLICANT',
    },
  });

  const applicantTwo = await prisma.user.create({
    data: {
      name: 'Bianca Candidate',
      email: 'bianca@applicant.com',
      password: defaultPasswordHash,
      role: 'APPLICANT',
    },
  });

  const applicantThree = await prisma.user.create({
    data: {
      name: 'Carlos Talent',
      email: 'carlos@applicant.com',
      password: defaultPasswordHash,
      role: 'APPLICANT',
    },
  });

  const alexCvPath = await ensureSeedCv('seed-alex.pdf', 'Alex Applicant CV');
  const biancaCvPath = await ensureSeedCv('seed-bianca.pdf', 'Bianca Candidate CV');
  const carlosCvPath = await ensureSeedCv('seed-carlos.pdf', 'Carlos Talent CV');

  const appOne = await prisma.application.create({
    data: {
      userId: applicantOne.id,
      status: 'APPLIED',
      score: 10.8,
      experienceText: 'Built internal dashboards and maintained backend services for three years.',
      cvPath: alexCvPath,
      fullName: 'Alex Applicant',
      email: 'alex@applicant.com',
      phone: '+1 202-555-0111',
      location: 'Austin, TX',
      mandatoryMet: true,
      mandatorySelections: JSON.stringify(mustHaveCriteria.map((criteria) => criteria.id)),
      preferredSelections: JSON.stringify([
        { criteriaId: niceToHaveCriteria[0].id, yearsExperience: 2 },
        { criteriaId: niceToHaveCriteria[1].id, yearsExperience: 3 },
      ]),
    },
  });

  const appTwo = await prisma.application.create({
    data: {
      userId: applicantTwo.id,
      status: 'SHORTLISTED',
      score: 18.4,
      experienceText: 'Led frontend modernization and collaborated with product and analytics teams.',
      cvPath: biancaCvPath,
      fullName: 'Bianca Candidate',
      email: 'bianca@applicant.com',
      phone: '+1 202-555-0122',
      location: 'Seattle, WA',
      mandatoryMet: true,
      mandatorySelections: JSON.stringify(mustHaveCriteria.map((criteria) => criteria.id)),
      preferredSelections: JSON.stringify([
        { criteriaId: niceToHaveCriteria[0].id, yearsExperience: 4 },
        { criteriaId: niceToHaveCriteria[2].id, yearsExperience: 3 },
        { criteriaId: niceToHaveCriteria[3].id, yearsExperience: 4 },
      ]),
    },
  });

  const appThree = await prisma.application.create({
    data: {
      userId: applicantThree.id,
      status: 'REJECTED',
      score: 3.0,
      experienceText: 'Entry-level experience in web development and support tasks.',
      cvPath: carlosCvPath,
      fullName: 'Carlos Talent',
      email: 'carlos@applicant.com',
      phone: '+1 202-555-0133',
      location: 'Denver, CO',
      mandatoryMet: false,
      mandatorySelections: JSON.stringify([mustHaveCriteria[0].id]),
      preferredSelections: JSON.stringify([{ criteriaId: niceToHaveCriteria[1].id, yearsExperience: 1 }]),
    },
  });

  await prisma.score.createMany({
    data: [
      {
        applicationId: appTwo.id,
        reviewerId: reviewer.id,
        category: 'technical',
        value: 5,
      },
      {
        applicationId: appTwo.id,
        reviewerId: reviewer.id,
        category: 'communication',
        value: 4,
      },
      {
        applicationId: appTwo.id,
        reviewerId: reviewer.id,
        category: 'problem_solving',
        value: 5,
      },
    ],
  });

  await prisma.note.create({
    data: {
      applicationId: appTwo.id,
      reviewerId: reviewer.id,
      content: 'Strong alignment with role requirements. Recommend interview scheduling.',
    },
  });

  await prisma.eventLog.createMany({
    data: [
      {
        applicationId: appOne.id,
        actorId: applicantOne.id,
        action: 'Application submitted with status APPLIED',
      },
      {
        applicationId: appTwo.id,
        actorId: applicantTwo.id,
        action: 'Application submitted with status APPLIED',
      },
      {
        applicationId: appTwo.id,
        actorId: reviewer.id,
        action: 'Status changed from APPLIED to SHORTLISTED',
      },
      {
        applicationId: appTwo.id,
        actorId: reviewer.id,
        action: 'Reviewer updated scores (technical, communication, problem_solving)',
      },
      {
        applicationId: appThree.id,
        actorId: applicantThree.id,
        action: 'Application submitted with status REJECTED',
      },
      {
        applicationId: appThree.id,
        actorId: applicantThree.id,
        action: 'Auto rejected: mandatory criteria not met',
      },
      {
        applicationId: appThree.id,
        actorId: admin.id,
        action: 'Admin review complete for rejected profile',
      },
    ],
  });

  console.log('Seed complete');
  console.log('Admin: admin@system.com / 1234');
  console.log('Reviewer: reviewer@system.com / 1234');
  console.log('Applicants: alex@applicant.com, bianca@applicant.com, carlos@applicant.com / 1234');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
