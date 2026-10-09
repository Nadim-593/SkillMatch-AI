const required = [
  'JWT_SECRET',
  'AI_SERVICE_URL',
];

const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[ERROR] Missing required environment variables: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else {
    console.log('[INFO] Environment variables validated successfully.');
  }
};

module.exports = { validateEnv };
