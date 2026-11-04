import { expect, type Locator, type Page } from "@playwright/test";

export async function openTool(page: Page, tool: RegExp) {
  await page.goto("/");
  await page.getByRole("radio", { name: tool }).click();
}

function timeRoot(page: Page, groupName?: string): Locator {
  return groupName ? page.getByRole("group", { name: groupName }) : page.locator("form");
}

export async function fillStructuredTime(
  page: Page,
  values: { hours?: string; minutes: string; seconds: string },
  groupName?: string,
) {
  const root = timeRoot(page, groupName);
  if (values.hours !== undefined) {
    const hours = root.getByRole("textbox", { name: "Hours", exact: true });
    if (await hours.count()) {
      await hours.fill(values.hours);
    }
  }
  await root.getByRole("textbox", { name: "Minutes", exact: true }).fill(values.minutes);
  await root.getByRole("textbox", { name: "Seconds", exact: true }).fill(values.seconds);
}

export async function calculate(page: Page) {
  await page.getByRole("button", { name: "Calculate my result" }).click();
}

export async function expectEstimate(page: Page, displayTime: string) {
  const estimate = page.locator(".run-lab-calculator__estimate");
  await expect(estimate).toContainText(/Estimated .+ performance/i);
  await expect(estimate).toContainText("Central prediction");
  await expect(estimate.locator(".run-lab-calculator__range-central-row strong")).toHaveText(displayTime);
  await expect(estimate.locator("b")).toContainText("–");
  await expect(estimate).toContainText(/Indicative performance range using ±/i);
}

export async function expectMetric(page: Page, label: string, value: string) {
  const metric = page.getByText(label, { exact: true }).locator("..");
  await expect(metric).toContainText(value);
}

export function timeField(page: Page, label: "Hours" | "Minutes" | "Seconds", groupName?: string) {
  return timeRoot(page, groupName).getByRole("textbox", { name: label, exact: true });
}
