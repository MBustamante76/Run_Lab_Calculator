import { expect, request as playwrightRequest, test, type Page } from "@playwright/test";

const wpURL = process.env.WP_ADMIN_URL ?? "http://127.0.0.1:8881";
const defaultHeadline = "Know your pace.";
const defaultPurposeStart = "Imagine Sarah has a 1500m PB of 5:30";
const overrideHeadline = "WP copy check headline.";
const overridePurpose = "WP copy check purpose for Tool 01.";
const toolIds = ["predict", "pace", "finish", "target", "splits", "profile", "ageGrade"] as const;
const toolFields = ["title", "description", "purpose", "formLead"] as const;
const introFields = ["eyebrow", "headlineLead", "headlineAccent", "summary", "sideTitle", "sideBody"] as const;

function marker(group: string, field: string) {
  return `COPY ${group} ${field}`;
}

function editableFields() {
  const intro = introFields.map((field) => ({
    selector: `#run-lab-intro-${field}`,
    value: marker("intro", field),
    intro: true,
  }));
  const disclaimer = [
    {
      selector: "#run-lab-disclaimer",
      value: marker("disclaimer", "text"),
      intro: true,
    },
  ];
  const tools = toolIds.flatMap((toolId) =>
    toolFields.map((field) => ({
      selector: `#run-lab-tool-${toolId}-${field}`,
      value: marker(toolId, field),
      intro: false,
    })),
  );
  return [...intro, ...disclaimer, ...tools];
}

test.describe.configure({ mode: "serial" });

test.describe("WordPress admin calculator copy", () => {
  test.use({ baseURL: wpURL });
  test.setTimeout(120_000);

  let calculatorPageUrl = "";

  test.beforeAll(async () => {
    const context = await playwrightRequest.newContext();
    const response = await context.get(`${wpURL}/wp-login.php`, { timeout: 8_000 }).catch(() => null);
    await context.dispose();
    test.skip(!response?.ok(), `WordPress admin is not running at ${wpURL}`);
  });

  test("reset restores the built-in wording", async ({ page }) => {
    await login(page);
    await openCopySettings(page);
    await page.getByRole("button", { name: "Reset to defaults" }).click();
    await expect(page.getByText("Calculator copy reset to the built-in wording.")).toBeVisible();
    await expect(page.locator("#run-lab-intro-headlineLead")).toHaveValue(defaultHeadline);
    await expect(page.locator("#run-lab-tool-predict-purpose")).toHaveValue(new RegExp(defaultPurposeStart));
  });

  test("saves an override and keeps it after reload", async ({ page }) => {
    await login(page);
    await openCopySettings(page);
    await page.locator("#run-lab-intro-headlineLead").fill(overrideHeadline);
    await saveCopy(page);
    await expect(page.getByText("Settings saved.")).toBeVisible();
    await page.reload();
    await expect(page.locator("#run-lab-intro-headlineLead")).toHaveValue(overrideHeadline);
    await expect(page.locator("#run-lab-intro-headlineAccent")).toHaveValue("Own your race.");
  });

  test("a blank field falls back to the built-in wording", async ({ page }) => {
    await login(page);
    await openCopySettings(page);
    await page.locator("#run-lab-intro-headlineLead").fill("");
    await saveCopy(page);
    await expect(page.locator("#run-lab-intro-headlineLead")).toHaveValue(defaultHeadline);
  });

  test("strips HTML from saved copy", async ({ page }) => {
    await login(page);
    await openCopySettings(page);
    await page.locator("#run-lab-disclaimer").fill("Safe note <b>bold</b> <script>alert(1)</script>");
    await saveCopy(page);
    const disclaimer = await page.locator("#run-lab-disclaimer").inputValue();
    expect(disclaimer).toContain("Safe note");
    expect(disclaimer).toContain("bold");
    expect(disclaimer).not.toContain("<");
    expect(disclaimer).not.toContain("script");
  });

  test("a published calculator page uses the saved wording", async ({ page }) => {
    await login(page);
    await openCopySettings(page);
    await page.locator("#run-lab-intro-headlineLead").fill(overrideHeadline);
    await page.locator("#run-lab-tool-predict-purpose").fill(overridePurpose);
    await saveCopy(page);

    calculatorPageUrl = await publishCalculatorPage(page);
    await page.goto(calculatorPageUrl);
    await expect(page.getByText(overrideHeadline)).toBeVisible();
    await expect(page.getByText(overridePurpose)).toBeVisible();
    await expect(page.locator(".run-lab-calculator__estimate")).toHaveCount(0);

    const localized = await page.evaluate(
      () => (window as Window & { runLabCalculatorCopy?: unknown }).runLabCalculatorCopy,
    );
    expect(localized).toMatchObject({
      intro: { headlineLead: overrideHeadline },
      tools: { predict: { purpose: overridePurpose } },
    });
  });

  test("every settings field saves, reloads, and shows on the calculator", async ({ page }) => {
    test.setTimeout(180_000);
    const fields = editableFields();

    await login(page);
    await openCopySettings(page);
    for (const field of fields) {
      await page.locator(field.selector).fill(field.value);
    }
    await saveCopy(page);
    await page.reload();
    for (const field of fields) {
      await expect(page.locator(field.selector), field.selector).toHaveValue(field.value);
    }

    const calculatorUrl = await publishCalculatorPage(page);
    await page.goto(calculatorUrl);
    const shown: Record<string, string> = {
      "#run-lab-intro-eyebrow": ".run-lab-calculator__eyebrow",
      "#run-lab-intro-headlineLead": ".run-lab-calculator__intro h1",
      "#run-lab-intro-headlineAccent": ".run-lab-calculator__intro h1 span",
      "#run-lab-intro-summary": ".run-lab-calculator__summary",
      "#run-lab-intro-sideTitle": ".run-lab-calculator__side-note strong",
      "#run-lab-intro-sideBody": ".run-lab-calculator__side-note p",
      "#run-lab-disclaimer": ".run-lab-calculator__disclaimer",
    };
    for (const field of fields.filter((field) => field.intro)) {
      await expect(page.locator(shown[field.selector])).toContainText(field.value);
    }
    for (const toolId of toolIds) {
      await page.getByRole("radio", { name: new RegExp(marker(toolId, "title")) }).click();
      const panel = page.locator(".run-lab-calculator__panel");
      await expect(panel.locator("h3")).toHaveText(marker(toolId, "title"));
      await expect(panel.locator(".run-lab-calculator__panel-summary")).toHaveText(marker(toolId, "description"));
      await expect(panel.locator(".run-lab-calculator__purpose-text")).toHaveText(marker(toolId, "purpose"));
      await expect(panel.locator(".run-lab-calculator__form-lead")).toHaveText(marker(toolId, "formLead"));
    }

    await openCopySettings(page);
    await page.getByRole("button", { name: "Reset to defaults" }).click();
    await expect(page.locator("#run-lab-intro-headlineLead")).toHaveValue(defaultHeadline);
    await page.goto(calculatorUrl);
    await expect(page.locator(".run-lab-calculator__intro h1")).toContainText(defaultHeadline);
    await expect(page.locator(".run-lab-calculator__panel h3")).toHaveText("Predict my times at other distances");
    await expect(page.getByText(marker("predict", "title"))).toHaveCount(0);
  });

  test("reset restores the published page to the built-in wording", async ({ page }) => {
    test.skip(!calculatorPageUrl, "Calculator page was not published");
    await login(page);
    await openCopySettings(page);
    await page.getByRole("button", { name: "Reset to defaults" }).click();
    await expect(page.getByText("Calculator copy reset to the built-in wording.")).toBeVisible();

    await page.goto(calculatorPageUrl);
    await expect(page.getByText(defaultHeadline)).toBeVisible();
    await expect(page.getByText(defaultPurposeStart)).toBeVisible();
    await expect(page.getByText(overrideHeadline)).toHaveCount(0);
    await expect(page.getByText(overridePurpose)).toHaveCount(0);
  });
});

async function login(page: Page) {
  await page.goto("/wp-login.php");
  await page.locator("#user_login").fill("admin");
  await page.locator("#user_pass").fill("password");
  await Promise.all([
    page.waitForURL(/wp-admin/),
    page.locator("#loginform").evaluate((form: HTMLFormElement) => form.submit()),
  ]);
  await dismissSessionDialog(page);
}

async function openCopySettings(page: Page) {
  await page.goto("/wp-admin/options-general.php?page=run-lab-calculator");
  await dismissSessionDialog(page);
  await expect(page.getByRole("heading", { name: "RUN-LAB Calculator", level: 1 })).toBeVisible();
}

async function saveCopy(page: Page) {
  await Promise.all([
    page.waitForURL(/page=run-lab-calculator/),
    page.getByRole("button", { name: "Save copy" }).click(),
  ]);
  await dismissSessionDialog(page);
}

async function dismissSessionDialog(page: Page) {
  const close = page.locator("#wp-auth-check-wrap:visible .wp-auth-check-close");
  if (await close.count()) {
    await close.first().click();
  }
}

async function publishCalculatorPage(page: Page): Promise<string> {
  const nonce = await page.request.get("/wp-admin/admin-ajax.php?action=rest-nonce");
  const token = (await nonce.text()).trim();
  const response = await page.request.post("/wp-json/wp/v2/pages", {
    headers: { "X-WP-Nonce": token },
    data: {
      title: "Calculator copy check",
      content: "[run_lab_calculator]",
      status: "publish",
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = (await response.json()) as { link?: string };
  expect(body.link).toBeTruthy();
  return body.link ?? "";
}
