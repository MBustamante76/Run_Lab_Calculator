import { expect, test } from "@playwright/test";
import { calculate, expectEstimate, fillStructuredTime, openTool, timeField } from "./helpers";


test.describe("Michael feedback — Tool 01 Testing Log + UX", () => {
  test.beforeEach(async ({ page }) => {
    await openTool(page, /01\s*predict my times/i);
  });

  test("UX-01 / UX-18 Sarah purpose copy", async ({ page }) => {
    await expect(page.getByText(/Imagine Sarah has a 1500m PB of 5:30/i)).toBeVisible();
    await expect(page.getByText(/joining two dots on a graph/i)).toBeVisible();
    await expect(page.getByText(/useful guide, not a guarantee/i)).toBeVisible();
  });

  test("UX-02 minute/second steppers", async ({ page }) => {
    await fillStructuredTime(page, { minutes: "1", seconds: "59" }, "PB time");
    await page.getByRole("button", { name: "Increase seconds" }).click();
    await expect(timeField(page, "Minutes", "PB time")).toHaveValue("2");
    await expect(timeField(page, "Seconds", "PB time")).toHaveValue("0");
  });


  test("UX-03 Calculate amber, Reset white", async ({ page }) => {
    const go = page.getByRole("button", { name: "Calculate my result" });
    const reset = page.getByRole("button", { name: "Reset" });
    await expect(go).toHaveCSS("background-color", "rgb(255, 180, 0)");
    await expect(go).toHaveCSS("color", "rgb(17, 17, 17)");
    await expect(reset).toHaveCSS("background-color", "rgb(255, 255, 255)");
  });

  test("Test 01 — 1500m 4:30 → 3000m (UX-06 whole seconds)", async ({ page }) => {
    await page.getByLabel("PB distance").selectOption("1500");
    await fillStructuredTime(page, { minutes: "4", seconds: "30" }, "PB time");
    await page.getByLabel("Target distance").selectOption("3000");
    await calculate(page);
    await expectEstimate(page, "9:23");
  });

  test("Test 02 — 3000m 10:00 → 5000m", async ({ page }) => {
    await page.getByLabel("PB distance").selectOption("3000");
    await fillStructuredTime(page, { minutes: "10", seconds: "0" }, "PB time");
    await page.getByLabel("Target distance").selectOption("5000");
    await calculate(page);
    await expectEstimate(page, "17:11");
  });

  test("Test 03 / QA-02 — standalone 5000m → 10K", async ({ page }) => {
    await page.getByLabel("PB distance").selectOption("5000");
    await fillStructuredTime(page, { minutes: "18", seconds: "0" }, "PB time");
    await page.getByLabel("Target distance").selectOption("10k");
    await calculate(page);
    await expectEstimate(page, "37:32");
  });

  test("Test 04 / METH-01 — 1500m 4:30 → 800m = 2:18.7", async ({ page }) => {
    await page.getByLabel("PB distance").selectOption("1500");
    await fillStructuredTime(page, { minutes: "4", seconds: "30" }, "PB time");
    await page.getByLabel("Target distance").selectOption("800");
    await calculate(page);
    await expectEstimate(page, "2:18.7");
    await expect(page.getByText(/General estimate from one PB/i)).toBeVisible();
  });

  test("Test 05 + UX-05 — two PBs name both anchors", async ({ page }) => {
    await page.getByLabel("PB distance").selectOption("1500");
    await fillStructuredTime(page, { minutes: "4", seconds: "30" }, "PB time");
    await page.getByRole("button", { name: "+ Add another PB" }).click();
    await page.getByLabel("Second PB distance").selectOption("5000");
    await fillStructuredTime(page, { minutes: "17", seconds: "0" }, "Second PB time");
    await page.getByLabel("Target distance").selectOption("3000");
    await calculate(page);
    await expectEstimate(page, "9:40");
    await expect(page.getByText("Based on your two PBs")).toBeVisible();
    await expect(page.getByText(/Based on your 1500m PB of 4:30\.0 and your 5000m PB of 17:00\.0/)).toBeVisible();
  });

  test("Test 06 — outside bracket falls back to nearest PB", async ({ page }) => {
    await page.getByLabel("PB distance").selectOption("1500");
    await fillStructuredTime(page, { minutes: "4", seconds: "30" }, "PB time");
    await page.getByRole("button", { name: "+ Add another PB" }).click();
    await page.getByLabel("Second PB distance").selectOption("5000");
    await fillStructuredTime(page, { minutes: "17", seconds: "0" }, "Second PB time");
    await page.getByLabel("Target distance").selectOption("10k");
    await calculate(page);
    await expectEstimate(page, "35:27");
    await expect(page.getByText(/outside your two PB distances/i)).toBeVisible();
    await expect(page.getByText(/uses your 5000m PB only/i)).toBeVisible();
  });

  test("Test 07A — speed-oriented two-PB interpolation", async ({ page }) => {
    await page.getByLabel("PB distance").selectOption("1500");
    await fillStructuredTime(page, { minutes: "4", seconds: "30" }, "PB time");
    await page.getByRole("button", { name: "+ Add another PB" }).click();
    await page.getByLabel("Second PB distance").selectOption("5000");
    await fillStructuredTime(page, { minutes: "19", seconds: "0" }, "Second PB time");
    await page.getByLabel("Target distance").selectOption("3000");
    await calculate(page);
    await expectEstimate(page, "10:19");
  });

  test("Test 07B — endurance-oriented two-PB interpolation", async ({ page }) => {
    await page.getByLabel("PB distance").selectOption("1500");
    await fillStructuredTime(page, { minutes: "4", seconds: "30" }, "PB time");
    await page.getByRole("button", { name: "+ Add another PB" }).click();
    await page.getByLabel("Second PB distance").selectOption("5000");
    await fillStructuredTime(page, { minutes: "16", seconds: "0" }, "Second PB time");
    await page.getByLabel("Target distance").selectOption("3000");
    await calculate(page);
    await expectEstimate(page, "9:20");
  });

  test("Test 08 — reverse PB order matches test 05", async ({ page }) => {
    await page.getByLabel("PB distance").selectOption("5000");
    await fillStructuredTime(page, { minutes: "17", seconds: "0" }, "PB time");
    await page.getByRole("button", { name: "+ Add another PB" }).click();
    await page.getByLabel("Second PB distance").selectOption("1500");
    await fillStructuredTime(page, { minutes: "4", seconds: "30" }, "Second PB time");
    await page.getByLabel("Target distance").selectOption("3000");
    await calculate(page);
    await expectEstimate(page, "9:40");
  });

  test("Test 09 — duplicate PB distance omitted", async ({ page }) => {
    await page.getByLabel("PB distance").selectOption("1500");
    await page.getByRole("button", { name: "+ Add another PB" }).click();
    await expect(page.getByLabel("Second PB distance").locator('option[value="1500"]')).toHaveCount(0);
  });

  test("Test 10 — blank time requires minutes and seconds", async ({ page }) => {
    await timeField(page, "Minutes", "PB time").fill("");
    await timeField(page, "Seconds", "PB time").fill("");
    await calculate(page);
    await expect(page.getByRole("alert")).toContainText("Enter the minutes.");
    await expect(page.getByRole("alert")).toContainText("Enter the seconds.");
  });


  test("Test 11 — seconds 75 rejected", async ({ page }) => {
    await fillStructuredTime(page, { minutes: "4", seconds: "75" }, "PB time");
    await calculate(page);
    await expect(page.getByRole("alert")).toContainText("Seconds must be less than 60.");
  });

  test("Test 12 / QA-01 — decimal seconds accepted on supported route", async ({ page }) => {
    await page.getByLabel("PB distance").selectOption("800");
    await fillStructuredTime(page, { minutes: "2", seconds: "15.75" }, "PB time");
    await page.getByLabel("Target distance").selectOption("1500");
    await calculate(page);
    await expect(page.getByText("Estimated equivalent performance")).toBeVisible();
    await expect(page.locator(".run-lab-calculator__estimate b")).not.toHaveText("--:--");
  });

  test("Test 13 — PB and target cannot both be 1500m", async ({ page }) => {
    await page.getByLabel("PB distance").selectOption("1500");
    await expect(page.getByLabel("Target distance").locator('option[value="1500"]')).toHaveCount(0);
  });

  test("Test 14 — zero time rejected", async ({ page }) => {
    await fillStructuredTime(page, { minutes: "0", seconds: "0" }, "PB time");
    await calculate(page);
    await expect(page.getByRole("alert")).toContainText("Enter a time greater than zero.");
  });

  test("Test 15 — reset clears two PBs and result", async ({ page }) => {
    await page.getByLabel("PB distance").selectOption("1500");
    await fillStructuredTime(page, { minutes: "4", seconds: "30" }, "PB time");
    await page.getByRole("button", { name: "+ Add another PB" }).click();
    await page.getByLabel("Second PB distance").selectOption("5000");
    await fillStructuredTime(page, { minutes: "17", seconds: "0" }, "Second PB time");
    await page.getByLabel("Target distance").selectOption("3000");
    await calculate(page);
    await expectEstimate(page, "9:40");
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(timeField(page, "Minutes", "PB time")).toHaveValue("5");
    await expect(timeField(page, "Seconds", "PB time")).toHaveValue("30");
    await expect(page.getByLabel("Second PB distance")).toHaveCount(0);
    await expect(page.locator(".run-lab-calculator__estimate")).toHaveCount(0);
  });

  test("Test 16 — negative minutes rejected", async ({ page }) => {
    await fillStructuredTime(page, { minutes: "-4", seconds: "0" }, "PB time");
    await calculate(page);
    await expect(page.getByRole("alert")).toContainText("Minutes cannot be negative.");
  });
});
