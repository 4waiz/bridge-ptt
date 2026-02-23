const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const applicantRoutes = require('./routes/applicant.routes');
const reviewerRoutes = require('./routes/reviewer.routes');
const adminRoutes = require('./routes/admin.routes');
const fileRoutes = require('./routes/file.routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/applicant', applicantRoutes);
app.use('/api/reviewer', reviewerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', fileRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
