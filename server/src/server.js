require('dotenv').config();

const app = require('./app');
const prisma = require('./prisma');

const port = Number(process.env.PORT) || 4000;

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

async function gracefulShutdown(signal) {
  console.log(`Received ${signal}, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
