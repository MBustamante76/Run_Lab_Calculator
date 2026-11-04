import { expect, test } from "@playwright/test";
import { calculate, expectMetric, fillStructuredTime, openTool, timeField } from "./helpers";


test.describe("Michael feedback — Tools 02/03 + site-wide", () => {
  test("UX-12 universal disclaimer under the six-tool shell", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText(/A note about your results\. RUN-LAB calculators use mathematical formulas/i),
    ).toBeVisible();
    await expect(page.locator(".run-lab-calculator__disclaimer")).toBeVisible();
  });

  test("UX-07 calculator shell remains usable at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Know your pace/i })).toBeVisible();
    await expect(page.getByRole("radio", { name: /01\s*predict/i })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
  });

  test("SCOPE-01 / SCOPE-02 — calculator does not take over site navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("radio", { name: /06\s*discover my performance profile/i })).toHaveAttribute(
      "aria-disabled",
      "false",
    );
    await expect(page.getByRole("navigation")).toHaveCount(0);
  });

  test("Test 19 — Tool 02 5000m in 17:30", async ({ page }) => {
    await openTool(page, /02\s*calculate my race pace/i);
    await page.getByLabel("Race distance").selectOption("5000");
    await fillStructuredTime(page, { minutes: "17", seconds: "30" });
    await calculate(page);
    await expectMetric(page, "Pace per km", "3:30");
    await expectMetric(page, "Pace per mile", "5:38");
    await expectMetric(page, "Speed km/h", "17.14");
    await expectMetric(page, "Speed mph", "10.65");
    await expectMetric(page, "Average 400 m", "1:24.0");
  });

  test("Test 20 + UX-10 — Tool 02 800m fractional splits with units", async ({ page }) => {
    await openTool(page, /02\s*calculate my race pace/i);
    await page.getByLabel("Race distance").selectOption("800");
    await fillStructuredTime(page, { minutes: "2", seconds: "15.75" });
    await calculate(page);
    await expectMetric(page, "Pace per km", "2:50");
    await expectMetric(page, "Average 100 m", "17.0s");
    await expectMetric(page, "Average 200 m", "33.9s");
    await expectMetric(page, "Average 400 m", "1:07.9");
  });

  test("Test 21 — Tool 02 1500m in 4:30", async ({ page }) => {
    await openTool(page, /02\s*calculate my race pace/i);
    await page.getByLabel("Race distance").selectOption("1500");
    await fillStructuredTime(page, { minutes: "4", seconds: "30" });
    await calculate(page);
    await expectMetric(page, "Pace per km", "3:00");
    await expectMetric(page, "Pace per mile", "4:50");
    await expectMetric(page, "Speed km/h", "20.00");
    await expectMetric(page, "Average 400 m", "1:12.0");
  });

  test("UX-08 hours field for times over 60 minutes", async ({ page }) => {
    await openTool(page, /02\s*calculate my race pace/i);
    await page.getByLabel("Race distance").selectOption("5000");
    await fillStructuredTime(page, { hours: "1", minutes: "10", seconds: "0" });
    await calculate(page);
    await expectMetric(page, "Pace per km", "14:00");
  });

  test("UX-09 / UX-15 / UX-20 100m, 200m and 10K available in Tool 02", async ({ page }) => {
    await openTool(page, /02\s*calculate my race pace/i);
    await expect(page.getByLabel("Race distance").locator('option[value="100"]')).toHaveCount(1);
    await expect(page.getByLabel("Race distance").locator('option[value="200"]')).toHaveCount(1);
    await expect(page.getByLabel("Race distance").locator('option[value="10k"]')).toHaveCount(1);
    await page.getByLabel("Race distance").selectOption("100");
    await fillStructuredTime(page, { minutes: "0", seconds: "12.5" });
    await calculate(page);
    await expect(page.getByText(/Sprint paces shown here are averages/i)).toBeVisible();
  });

  test("UX-15 Tool 02 10K in 1:05:00", async ({ page }) => {
    await openTool(page, /02\s*calculate my race pace/i);
    await page.getByLabel("Race distance").selectOption("10k");
    await fillStructuredTime(page, { hours: "1", minutes: "5", seconds: "0" });
    await calculate(page);
    await expectMetric(page, "Pace per km", "6:30");
    await expectMetric(page, "Pace per mile", "10:28");
    await expectMetric(page, "Speed km/h", "9.23");
    await expectMetric(page, "Speed mph", "5.74");
    await expectMetric(page, "Average 400 m", "2:36.0");
  });

  test("UX-11 / UX-20 100m, 200m and 10K in Tool 03", async ({ page }) => {
    await openTool(page, /03\s*calculate my finishing time/i);
    await expect(page.getByLabel("Race distance").locator('option[value="100"]')).toHaveCount(1);
    await expect(page.getByLabel("Race distance").locator('option[value="200"]')).toHaveCount(1);
    await expect(page.getByLabel("Race distance").locator('option[value="10k"]')).toHaveCount(1);
  });

  test("UX-20 Tools 01, 04 and 05 also keep 100m and 200m", async ({ page }) => {
    await openTool(page, /01\s*predict my times/i);
    await expect(page.getByLabel("PB distance").locator('option[value="100"]')).toHaveCount(1);
    await expect(page.getByLabel("PB distance").locator('option[value="200"]')).toHaveCount(1);

    await page.getByRole("radio", { name: /04\s*plan my target pb/i }).click();
    await expect(page.getByLabel("Target distance").locator('option[value="100"]')).toHaveCount(1);
    await expect(page.getByLabel("Target distance").locator('option[value="200"]')).toHaveCount(1);

    await page.getByRole("radio", { name: /05\s*build my race splits/i }).click();
    await expect(page.getByLabel("Race distance").locator('option[value="100"]')).toHaveCount(1);
    await expect(page.getByLabel("Race distance").locator('option[value="200"]')).toHaveCount(1);
  });

  test("UX-18 Tool 03 purpose uses approved Sophie copy", async ({ page }) => {
    await openTool(page, /03\s*calculate my finishing time/i);
    await expect(page.getByText(/Sophie wants to run 3000m at 4 minutes per kilometre/i)).toBeVisible();
    await expect(page.getByText(/calculation, not a prediction of your fitness/i)).toBeVisible();
  });

  test("UX-16 Tool 03 sub-minute finish shows seconds suffix", async ({ page }) => {
    await openTool(page, /03\s*calculate my finishing time/i);
    await page.getByLabel("Race distance").selectOption("100");
    await fillStructuredTime(page, { minutes: "2", seconds: "5" }, "Average pace");
    await calculate(page);
    await expectMetric(page, "Finishing time", "12.5s");
  });

  test("UX-03 Calculate hover stays amber", async ({ page }) => {
    await openTool(page, /01\s*predict my times/i);
    const go = page.getByRole("button", { name: "Calculate my result" });
    await expect(go).toHaveCSS("background-color", "rgb(255, 180, 0)");
    await go.hover();
    const hoverBg = await go.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(["rgb(240, 168, 0)", "rgb(255, 180, 0)"]).toContain(hoverBg);
  });

  test("UX-19 tool titles wrap within the selector card on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const title = page.getByRole("radio", { name: /01\s*predict my times at other distances/i });
    await expect(title).toBeVisible();
    const overflow = await title.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(overflow).toBe(false);
  });

  test("UX-22 selecting a tool scrolls its panel into view on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("radio", { name: /06\s*discover my performance profile/i }).click();
    const panel = page.locator(".run-lab-calculator__panel");
    await expect(panel.getByRole("heading", { level: 3, name: "Discover my performance profile" })).toBeVisible();
    await expect
      .poll(async () =>
        panel.evaluate((el) => {
          const top = el.getBoundingClientRect().top;
          return top >= 0 && top < window.innerHeight * 0.5;
        }),
      )
      .toBe(true);
  });

  test("UX-21 Tool 06 choice description stays inside the card", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    const card = page.getByRole("radio", { name: /06\s*discover my performance profile/i });
    const description = card.locator("small");
    await expect(description).toBeVisible();
    const clipped = await card.evaluate((el) => {
      const copy = el.querySelector(".run-lab-calculator__choice-copy");
      if (!(copy instanceof HTMLElement)) {
        return true;
      }
      return copy.scrollWidth > copy.clientWidth + 1 || el.scrollWidth > el.clientWidth + 1;
    });
    expect(clipped).toBe(false);
  });

  test("Test 22 — Tool 03 rejects negative seconds", async ({ page }) => {
    await openTool(page, /03\s*calculate my finishing time/i);
    await fillStructuredTime(page, { minutes: "3", seconds: "-15" }, "Average pace");
    await calculate(page);
    await expect(page.getByRole("alert")).toContainText("Seconds cannot be negative.");
  });

  test("Test 23 — Tool 03 rejects seconds 75", async ({ page }) => {
    await openTool(page, /03\s*calculate my finishing time/i);
    await fillStructuredTime(page, { minutes: "3", seconds: "75" }, "Average pace");
    await calculate(page);
    await expect(page.getByRole("alert")).toContainText("Seconds must be less than 60.");
  });

  test("Test 24 — Tool 03 rejects zero pace", async ({ page }) => {
    await openTool(page, /03\s*calculate my finishing time/i);
    await fillStructuredTime(page, { minutes: "0", seconds: "0" }, "Average pace");
    await calculate(page);
    await expect(page.getByRole("alert")).toContainText("Enter a time greater than zero.");
  });

  test("Test 25 — Tool 03 Reset clears errors and empty time", async ({ page }) => {
    await openTool(page, /03\s*calculate my finishing time/i);
    await fillStructuredTime(page, { minutes: "4", seconds: "60" }, "Average pace");
    await calculate(page);
    await expect(page.getByRole("alert")).toBeVisible();
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(timeField(page, "Hours", "Average pace")).toHaveValue("");
    await expect(timeField(page, "Minutes", "Average pace")).toHaveValue("");
    await expect(timeField(page, "Seconds", "Average pace")).toHaveValue("");
    await expect(page.locator(".run-lab-calculator__result")).toHaveCount(0);
  });
});
