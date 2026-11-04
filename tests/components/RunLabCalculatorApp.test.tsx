import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RunLabCalculatorApp } from "../../src/app/RunLabCalculatorApp";
import { calculatorDisclaimer } from "../../src/config/copy";
import { tools } from "../../src/tools/toolDefinitions";


function choice(name: RegExp) {
  return screen.getByRole("radio", { name });
}

const sprintDistanceCases = [
  { tool: /01\s*predict my times at other distances/i, selectLabel: "PB distance" },
  { tool: /02\s*calculate my race pace/i, selectLabel: "Race distance" },
  { tool: /03\s*calculate my finishing time/i, selectLabel: "Race distance" },
  { tool: /04\s*plan my target pb/i, selectLabel: "Target distance" },
  { tool: /05\s*build my race splits/i, selectLabel: "Race distance" },
] as const;

beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("calculator shell", () => {
  it("lists all seven tools as available and keeps the WordPress host chrome out", async () => {
    render(<RunLabCalculatorApp />);

    expect(screen.getByRole("heading", { name: "I want to…" })).toBeInTheDocument();
    expect(tools).toHaveLength(7);

    const predict = choice(/01\s*predict my times at other distances/i);
    expect(predict).toHaveAttribute("aria-checked", "true");
    expect(choice(/02\s*calculate my race pace/i)).toHaveAttribute("aria-disabled", "false");
    expect(choice(/03\s*calculate my finishing time/i)).toHaveAttribute("aria-disabled", "false");
    expect(choice(/04\s*plan my target pb/i)).toHaveAttribute("aria-disabled", "false");
    expect(choice(/05\s*build my race splits/i)).toHaveAttribute("aria-disabled", "false");
    expect(choice(/06\s*discover my performance profile/i)).toHaveAttribute("aria-disabled", "false");
    expect(choice(/07\s*age-grade my performance/i)).toHaveAttribute("aria-disabled", "false");
    expect(screen.queryByText("Coming in the next milestone")).not.toBeInTheDocument();
    expect(screen.queryByText("This calculator is coming in the next milestone.")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /book a consultation/i })).not.toBeInTheDocument();
    expect(screen.getByText(calculatorDisclaimer)).toBeInTheDocument();
  });


  it("UX-20 regression: Tools 01–05 still offer 100m and 200m in their distance dropdowns", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);

    for (const { tool, selectLabel } of sprintDistanceCases) {
      await user.click(choice(tool));
      const select = screen.getByLabelText(selectLabel);
      expect(within(select).getByRole("option", { name: "100m" }), `${selectLabel} on ${tool}`).toBeInTheDocument();
      expect(within(select).getByRole("option", { name: "200m" }), `${selectLabel} on ${tool}`).toBeInTheDocument();
    }
  });

  it("switches the active panel among the enabled tools", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);

    await user.click(choice(/02\s*calculate my race pace/i));
    expect(screen.getByRole("heading", { level: 3, name: "Calculate my race pace" })).toBeInTheDocument();

    await user.click(choice(/03\s*calculate my finishing time/i));
    expect(screen.getByRole("heading", { level: 3, name: "Calculate my finishing time" })).toBeInTheDocument();

    await user.click(choice(/04\s*plan my target pb/i));
    expect(screen.getByRole("heading", { level: 3, name: "Plan my target PB" })).toBeInTheDocument();

    choice(/04\s*plan my target pb/i).focus();
    await user.keyboard("{ArrowUp}");
    expect(choice(/03\s*calculate my finishing time/i)).toHaveAttribute("aria-checked", "true");
  });

  it("scrolls the selected tool panel into view after the first choice", async () => {
    const user = userEvent.setup();
    const scrollIntoView = HTMLElement.prototype.scrollIntoView as ReturnType<typeof vi.fn>;

    render(<RunLabCalculatorApp />);
    expect(scrollIntoView).not.toHaveBeenCalled();

    await user.click(choice(/06\s*discover my performance profile/i));
    expect(screen.getByRole("heading", { level: 3, name: "Discover my performance profile" })).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("opens and closes the purpose text from the keyboard", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);

    const purpose = screen.getByRole("button", { name: "What is it for?" });
    expect(purpose).toHaveAttribute("aria-expanded", "true");
    purpose.focus();
    await user.keyboard("{Enter}");
    expect(purpose).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/Imagine Sarah has a 1500m PB of 5:30/i)).not.toBeInTheDocument();
    expect(screen.getByText(calculatorDisclaimer)).toBeInTheDocument();
  });
});

