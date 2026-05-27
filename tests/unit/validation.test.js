import { isValidEmail, parseLimit } from "../../utils/validation.js";

describe("validation utils", () => {
  it("parses and clamps limits", () => {
    expect(parseLimit("3", 5)).toBe(3);
    expect(parseLimit("0", 5)).toBe(1);
    expect(parseLimit("100", 5)).toBe(25);
    expect(parseLimit("bad", 5)).toBe(5);
  });

  it("validates email addresses", () => {
    expect(isValidEmail("delivered@resend.dev")).toBe(true);
    expect(isValidEmail("invalid-email")).toBe(false);
  });
});
