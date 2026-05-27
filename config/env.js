export function requireEnv(name) {
  const value = process.env[name];

  if (!value || value.includes("your_")) {
    const error = new Error(`${name} is not configured`);
    error.statusCode = 500;
    throw error;
  }

  return value;
}
