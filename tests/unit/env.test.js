describe("env config", () => {
  afterEach(() => {
    delete process.env.TEST_REQUIRED_ENV;
  });

  it("returns configured env values", async () => {
    process.env.TEST_REQUIRED_ENV = "configured";

    const { requireEnv } = await import("../../config/env.js");

    expect(requireEnv("TEST_REQUIRED_ENV")).toBe("configured");
  });

  it("throws for missing env values", async () => {
    const { requireEnv } = await import("../../config/env.js");

    expect(() => requireEnv("TEST_REQUIRED_ENV")).toThrow(
      "TEST_REQUIRED_ENV is not configured"
    );
  });
});
