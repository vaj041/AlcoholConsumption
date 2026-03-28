import rateLimit from 'express-rate-limit';

const parsePositiveNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const windowMs = parsePositiveNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const max = parsePositiveNumber(process.env.AUTH_RATE_LIMIT_MAX, 10);

export const authRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again later.',
  },
});
