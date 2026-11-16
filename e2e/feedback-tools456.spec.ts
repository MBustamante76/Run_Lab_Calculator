import { expect, test } from "@playwright/test";
import { calculate, expectMetric, fillStructuredTime, openTool } from "./helpers";

test.describe("Tools 04 / 05 / 06 / 07", () => {
  test("COPY-04–07 approved What is it for? scenarios", async ({ page }) => {
    await openTool(page, /04\s*plan my target pb/i);
    await expect(page.getByText(/Omar has a 1500m PB of 5:10/i)).toBeVisible();

    await page.getByRole("radio", { name: /05\s*build my race splits/i }).click();
    await expect(page.getByText(/Javier wants to run 800m in 2:20/i)).toBeVisible();

    await page.getByRole("radio", { name: /06\s*discover my performance profile/i }).click();
    await expect(page.getByText(/Layla runs 800m, 1500m and 3000m/i)).toBeVisible();

    await page.getByRole("radio", { name: /07\s*age-grade my performance/i }).click();
    await expect(page.getByText(/Pat is 45 and has just run 5K in 22 minutes/i)).toBeVisible();
  });

  test("UX-P2-02 validation errors use restrained red styling", async ({ page }) => {
    await openTool(page, /05\s*build my race splits/i);
    await fillStructuredTime(page, { minutes: "0", seconds: "0" }, "Goal finishing time");
    await calculate(page);
    const summary = page.getByRole("alert");
    await expect(summary).toBeVisible();
    await expect(summary).toHaveCSS("background-color", "rgb(255, 241, 240)");
    await expect(summary).toHaveCSS("color", "rgb(180, 35, 24)");
  });

  test("Mobile UX — Calculate scrolls Tool 06 results into view", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await openTool(page, /06\s*discover my performance profile/i);
    for (let i = 0; i < 3; i += 1) {
      await page.getByRole("button", { name: /\+ Add another performance/i }).click();
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await calculate(page);
    const target = page.locator(".run-lab-calculator__scroll-target").first();
    await expect(target).toBeVisible();
    await expect
      .poll(async () =>
        target.evaluate((el) => {
          const top = el.getBoundingClientRect().top;
          return top >= 0 && top < window.innerHeight * 0.55;
        }),
      )
      .toBe(true);
  });

  test("Tool 04 — 1500m target 5:00 shows required pace and even 400 m", async ({ page }) => {
    await openTool(page, /04\s*plan my target pb/i);
    await expect(page.getByText(/Omar has a 1500m PB of 5:10/i)).toBeVisible();
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
    await expect(page.getByRole("radio", { name: "Male", exact: true })).toBeChecked();
    await calculate(page);
    await expect(page.getByLabel("PB 1 distance")).toHaveCount(0);
    await expect(page.getByText(/Strongest performance|Leading performances/i)).toBeVisible();
    await expect(page.getByText(/\d+ pts/).first()).toBeVisible();
    await expect(page.getByRole("img", { name: /Relative profile gauge/i })).toBeVisible();
    await expect(page.getByRole("img", { name: /World Athletics score chart/i })).toBeVisible();
    await expect(page.getByText(/Performance comparison based on World Athletics Scoring Tables/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit performances" })).toBeVisible();
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
