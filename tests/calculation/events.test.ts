import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { eventById, events } from "../../src/calculation/events";
import { METRES_PER_MILE } from "../../src/calculation/units";

function countLiteral(directory: string, literal: string): number {
  return readdirSync(directory)
    .filter((name) => name.endsWith(".ts"))
    .reduce((total, name) => {
      const source = readFileSync(join(directory, name), "utf8");
      return total + source.split(literal).length - 1;
    }, 0);
}

describe("event configuration", () => {
  it("defines one mile as 1609.344 m and 10K as 10000 m", () => {
    expect(eventById("mile").metres).toBe(1609.344);
    expect(eventById("mile").metres).toBe(METRES_PER_MILE);
    expect(eventById("10k").metres).toBe(10_000);
  });

  it("keeps ids unique and stores one catalogue", () => {
    const ids = events.map((event) => event.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(events).toHaveLength(12);
    expect(countLiteral("src/calculation", "1609.344")).toBe(1);
    expect(countLiteral("src/calculation", "export const events")).toBe(1);
  });

  it("limits 100 m, 200 m and 10K to prediction", () => {
    for (const id of ["100", "200", "10k"]) {
      expect(eventById(id).supportedToolIds).toEqual(["predict"]);
    }

    for (const id of ["400", "600", "800", "1000", "1500", "mile", "2000", "3000", "5000"]) {
      expect(eventById(id).supportedToolIds).toEqual(["predict", "pace", "finish"]);
    }
  });

  it("stores meaningful split options on each event", () => {
    expect(eventById("800").splitMetres).toEqual([100, 200, 400]);
    expect(eventById("5000").splitMetres).toEqual([400]);
    expect(eventById("100").splitMetres).toEqual([100]);
  });
});
