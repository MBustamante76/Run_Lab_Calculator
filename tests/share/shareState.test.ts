import { describe, expect, it } from "vitest";
import {
  appendShareCardLines,
  buildShareUrl,
  parseShareSearch,
  serializeShareState,
  timeFieldsFromMilliseconds,
  type ShareState,
} from "../../src/share/shareState";

const cases: ShareState[] = [
  { tool: "predict", e1: "1500", t1: 270_000, target: "3000" },
  { tool: "predict", e1: "1500", t1: 270_000, e2: "5000", t2: 1_020_000, target: "3000" },
  { tool: "pace", e: "5000", t: 1_320_000 },
  { tool: "target", e: "1500", t: 300_000 },
  { tool: "finish", e: "3000", t: 240_000, unit: "kilometre" },
  { tool: "splits", e: "800", t: 140_000, strategy: "negative", spacing: "400" },
  {
    tool: "profile",
    sex: "W",
    performances: [
      { e: "800", t: 130_000 },
      { e: "1500", t: 270_000 },
    ],
  },
  { tool: "ageGrade", sex: "M", age: 45, d: "5k", t: 1_320_000 },
];

describe("share links", () => {
  it.each(cases)("round-trips $tool", (state) => {
    expect(parseShareSearch(serializeShareState(state))).toEqual(state);
  });

  it("ignores a partial or unknown link", () => {
    expect(parseShareSearch("")).toBeNull();
    expect(parseShareSearch("?calc=predict&e1=1500")).toBeNull();
    expect(parseShareSearch("?calc=nope&e=1500&t=1000")).toBeNull();
    expect(parseShareSearch("?calc=predict&e1=1500&t1=270000&e2=1500&t2=1000&target=3000")).toEqual({
      tool: "predict",
      e1: "1500",
      t1: 270_000,
      target: "3000",
    });
  });

  it("splits a shared time back into form fields", () => {
    expect(timeFieldsFromMilliseconds(270_000, false)).toEqual({
      hours: "",
      minutes: "4",
      seconds: "30",
    });
    expect(timeFieldsFromMilliseconds(3_900_000, true)).toEqual({
      hours: "1",
      minutes: "5",
      seconds: "0",
    });
  });

  it("builds a page URL that keeps only the share query", () => {
    expect(
      buildShareUrl(
        { tool: "pace", e: "5000", t: 1_320_000 },
        "https://runlab.example/tools/?utm=1#result",
      ),
    ).toBe("https://runlab.example/tools/?calc=pace&e=5000&t=1320000");
  });

  it("adds preview lines without changing the calculator restore parameters", () => {
    const state: ShareState = { tool: "pace", e: "5000", t: 1_320_000 };
    const shared = appendShareCardLines(buildShareUrl(state, "https://runlab.example/tools/"), [
      "Pace per km",
      "3:20",
      "<b>bold</b> 18.00 km/h",
      "   ",
    ]);
    const url = new URL(shared);

    expect(parseShareSearch(url.search)).toEqual(state);
    expect(url.searchParams.get("card")).toBe("Pace per km\n3:20\nbold 18.00 km/h");
  });
});
