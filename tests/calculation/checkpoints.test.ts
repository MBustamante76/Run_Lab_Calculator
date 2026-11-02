import { describe, expect, it } from "vitest";
import {
  buildEvenCheckpointPlan,
  checkpointMetresFor,
  presentCheckpointPlan,
} from "../../src/calculation/checkpoints";

describe("checkpoints", () => {
  it("steps short races by 100 m", () => {
    expect(checkpointMetresFor(800)).toEqual([100, 200, 300, 400, 500, 600, 700, 800]);
  });

  it("steps middle races by 400 m and includes the finish", () => {
    expect(checkpointMetresFor(1500)).toEqual([400, 800, 1200, 1500]);
  });

  it("steps longer races by 1000 m", () => {
    expect(checkpointMetresFor(5000)).toEqual([1000, 2000, 3000, 4000, 5000]);
  });

  it("builds even cumulative times for 5000 m in 20:00", () => {
    const plan = buildEvenCheckpointPlan(5000, 20 * 60 * 1000);
    expect(plan.ok).toBe(true);
    if (!plan.ok) {
      return;
    }
    expect(plan.value.checkpoints).toHaveLength(5);
    expect(plan.value.checkpoints[0]).toMatchObject({
      metres: 1000,
      cumulativeMilliseconds: 4 * 60 * 1000,
      splitMilliseconds: 4 * 60 * 1000,
    });
    expect(plan.value.checkpoints[4]?.cumulativeMilliseconds).toBe(20 * 60 * 1000);
    const presented = presentCheckpointPlan(plan.value);
    expect(presented.checkpoints[0]?.cumulative).toBe("4:00.0");
    expect(presented.checkpoints[4]?.label).toBe("Finish");
  });

  it("rejects non-positive inputs", () => {
    const result = buildEvenCheckpointPlan(0, 0);
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.errors.map((error) => error.fieldId)).toEqual(["distance", "time"]);
  });
});
