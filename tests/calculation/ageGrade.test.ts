import { describe, expect, it } from "vitest";
import { ageGradeBand, calculateAgeGrade } from "../../src/calculation/ageGrade/ageGrade";

describe("age grade", () => {
  it("scores a male 45-year-old 5K at the age standard as 100%", () => {
    const result = calculateAgeGrade({
      sex: "M",
      age: 45,
      distanceId: "5k",
      milliseconds: 843_000,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.ageGradePercent).toBeCloseTo(100, 1);
    expect(result.value.bandLabel).toBe("World class");
  });

  it("labels common performance bands", () => {
    expect(ageGradeBand(92)).toBe("World class");
    expect(ageGradeBand(85)).toBe("National class");
    expect(ageGradeBand(72)).toBe("Regional class");
    expect(ageGradeBand(65)).toBe("Club level");
    expect(ageGradeBand(55)).toBe("Good club runner");
    expect(ageGradeBand(40)).toBe("Recreational");
  });

  it("rejects ages outside 5–100", () => {
    const result = calculateAgeGrade({
      sex: "W",
      age: 3,
      distanceId: "10k",
      milliseconds: 45 * 60 * 1000,
    });
    expect(result.ok).toBe(false);
  });
});
