import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RunLabCalculatorApp } from "../../src/app/RunLabCalculatorApp";
import { calculatorDisclaimer } from "../../src/config/copy";
import { tools } from "../../src/tools/toolDefinitions";


function choice(name: RegExp) {
  return screen.getByRole("radio", { name });
}

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

