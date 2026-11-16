import { expect, test } from "@playwright/test";

test("shared Tool 01 link prefills the result", async ({ page }) => {
  await page.goto("/?calc=predict&e1=1500&t1=270000&target=3000");
  await expect(page.getByRole("heading", { level: 3, name: "Predict my times at other distances" })).toBeVisible();
  await expect(page.getByLabel("PB distance")).toHaveValue("1500");
  await expect(page.getByRole("textbox", { name: "Minutes" })).toHaveValue("4");
  await expect(page.getByRole("textbox", { name: "Seconds" })).toHaveValue("30");
  await expect(page.getByLabel("Target distance")).toHaveValue("3000");
  await expect(page.locator(".run-lab-calculator__range-central-row strong")).toHaveText("9:23");
  await expect(page.getByRole("button", { name: "Share result" })).toBeVisible();
  await expect(page.locator(".run-lab-calculator__share-footer")).toContainText("calc=predict");
});
