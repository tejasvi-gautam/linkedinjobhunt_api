module.exports = {
  testEnvironment: "node",
  collectCoverageFrom: [
    "app.js",
    "config/**/*.js",
    "controllers/**/*.js",
    "middleware/**/*.js",
    "services/**/*.js",
    "utils/**/*.js"
  ],
  coveragePathIgnorePatterns: ["/node_modules/"],
  clearMocks: true,
  restoreMocks: true,
  verbose: true
};
