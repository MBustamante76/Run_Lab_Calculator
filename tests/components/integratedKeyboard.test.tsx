import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RunLabCalculatorApp } from "../../src/app/RunLabCalculatorApp";

describe("integrated calculator keyboard", () => {
  it("switches tools, completes a form, toggles info, submits and resets without a trap", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);

    const predict = screen.getByRole("radio", { name: /01\s*predict my times/i });
    const pace = screen.getByRole("radio", { name: /02\s*calculate my race pace/i });
    predict.focus();
    await user.keyboard("{ArrowDown}");
    expect(pace).toHaveAttribute("aria-checked", "true");
    expect(pace).toHaveFocus();

    const future = screen.getByRole("radio", { name: /04\s*plan my target pb/i });
    expect(future).toHaveAttribute("aria-disabled", "true");
    expect(future).toHaveTextContent("Future milestone");
    future.focus();
    await user.keyboard("{Enter}");
    expect(pace).toHaveAttribute("aria-checked", "true");

    const purpose = screen.getByRole("button", { name: "What is it for?" });
    purpose.focus();
    await user.keyboard("{Enter}");
    expect(purpose).toHaveAttribute("aria-expanded", "false");
    await user.keyboard("{Enter}");
    expect(purpose).toHaveAttribute("aria-expanded", "true");

    await user.click(pace);
    await user.tab();
    expect(screen.getByRole("button", { name: "What is it for?" })).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText("Race distance")).toHaveFocus();
    await user.tab();
    const minutes = screen.getByLabelText("Minutes");
    expect(minutes).toHaveFocus();
    await user.keyboard("20");
    await user.tab();
    await user.keyboard("0");
    await user.tab();
    expect(screen.getByRole("button", { name: "Calculate my result" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("Pace per km").parentElement).toHaveTextContent("4:00");

    await user.tab();
    expect(screen.getByRole("button", { name: "Reset" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Minutes")).toHaveValue("");
    expect(screen.queryByText("Pace per km")).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole("button", { name: "Reset" })).not.toHaveFocus();
    expect(document.body.contains(document.activeElement)).toBe(true);
  });
});
