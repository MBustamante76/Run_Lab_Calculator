import { expect, test } from "@playwright/test";
import { calculate, expectMetric, fillStructuredTime, openTool } from "./helpers";

test.describe("Tools 04 / 05 / 06 / 07", () => {
  test("Tool 04 — 1500m target 5:00 shows required pace and even 400 m", async ({ page }) => {
    await openTool(page, /04\s*plan my target pb/i);
    await expect(page.getByText(/Maya wants to run 1500m/i)).toBeVisible();
    await page.getByLabel("Target distance").selectOption("1500");
    await fillStructuredTime(page, { minutes: "5", seconds: "0" }, "Target PB time");
    await calculate(page);
    await expectMetric(page, "Required pace per km", "3:20");
    await expectMetric(page, "Even 400 m", "1:20.0");
  });

  test("Tool 05 — 5000m in 20:00 builds kilometre checkpoints", async ({ page }) => {
    await openTool(page, /05\s*build my race splits/i);
    await page.getByLabel("Race distance").selectOption("5000");
    await fillStructuredTime(page, { minutes: "20", seconds: "0" }, "Goal finishing time");
    await calculate(page);
    await expectMetric(page, "1000 m · cumulative", "4:00.0");
    await expectMetric(page, "Finish · cumulative", "20:00.0");
    await expect(page.getByText(/These are even-pace checkpoint times/i)).toBeVisible();
  });

  test("Tool 06 — two default PBs produce a ranked WA profile", async ({ page }) => {
    await openTool(page, /06\s*discover my performance profile/i);
    await expect(page.getByRole("radio", { name: "Men", exact: true })).toBeChecked();
    await calculate(page);
    await expect(page.getByText(/Strongest ·/i)).toBeVisible();
    await expect(page.getByText(/\d+ pts/).first()).toBeVisible();
    await expect(page.getByText(/Points use the World Athletics outdoor scoring tables/i)).toBeVisible();
  });

  test("Tool 05 — negative split keeps finish time and notes 2%", async ({ page }) => {
    await openTool(page, /05\s*build my race splits/i);
    await page.getByRole("radio", { name: /Negative split/i }).click();
    await page.getByLabel("Checkpoint every").selectOption("1000");
    await fillStructuredTime(page, { minutes: "20", seconds: "0" }, "Goal finishing time");
    await calculate(page);
    await expectMetric(page, "Finish · cumulative", "20:00.0");
    await expect(page.getByText(/These use a 2% negative split/i)).toBeVisible();
  });

  test("Tool 07 — age-grades the default male 5K case", async ({ page }) => {
    await openTool(page, /07\s*age-grade my performance/i);
    await expect(page.getByRole("radio", { name: "Male", exact: true })).toBeChecked();
    await calculate(page);
    await expect(page.getByText("Age-grade score")).toBeVisible();
    await expect(page.getByText(/USATF MLDR \/ WMA 2025/i)).toBeVisible();
  });

  test("Tools 04–07 are selectable in the shell", async ({ page }) => {
    await page.goto("/");
    for (const label of [
      /04\s*plan my target pb/i,
      /05\s*build my race splits/i,
      /06\s*discover my performance profile/i,
      /07\s*age-grade my performance/i,
    ]) {
      await expect(page.getByRole("radio", { name: label })).toHaveAttribute("aria-disabled", "false");
    }
  });
});
