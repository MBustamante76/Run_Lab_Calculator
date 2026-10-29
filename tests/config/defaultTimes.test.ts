import { describe, expect, it } from "vitest";
import { defaultTimeForEvent } from "../../src/config/defaultTimes";

describe("defaultTimes", () => {
  it("returns the Excel healthy-average benchmarks", () => {
    expect(defaultTimeForEvent("100")).toEqual({ hours: "", minutes: "0", seconds: "15" });
    expect(defaultTimeForEvent("1500")).toEqual({ hours: "", minutes: "5", seconds: "30" });
    expect(defaultTimeForEvent("5000")).toEqual({ hours: "", minutes: "22", seconds: "0" });
    expect(defaultTimeForEvent("10k")).toEqual({ hours: "", minutes: "45", seconds: "0" });
    expect(defaultTimeForEvent("mile")).toEqual({ hours: "", minutes: "6", seconds: "0" });
  });
});
