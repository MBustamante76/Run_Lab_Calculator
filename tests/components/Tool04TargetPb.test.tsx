import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RunLabCalculatorApp } from "../../src/app/RunLabCalculatorApp";

function choice(name: RegExp) {
  return screen.getByRole("radio", { name });
}

describe("Tool 04 target PB", () => {
  it("shows required pace and even splits for a 1500 m target", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await user.click(choice(/04\s*plan my target pb/i));

    await user.selectOptions(screen.getByLabelText("Target distance"), "1500");
    await user.clear(screen.getByLabelText("Minutes"));
    await user.type(screen.getByLabelText("Minutes"), "5");
    await user.clear(screen.getByLabelText("Seconds"));
    await user.type(screen.getByLabelText("Seconds"), "0");
    await user.click(screen.getByRole("button", { name: "Calculate my result" }));

    expect(screen.getByText("Required pace per km").parentElement).toHaveTextContent("3:20");
    expect(screen.getByText("Required pace per mile").parentElement).toHaveTextContent("5:22");
    expect(screen.getByText("Even 400 m").parentElement).toHaveTextContent("1:20.0");
    expect(screen.getByText(/Maya wants to run 1500m/i)).toBeInTheDocument();
  });

  it("resets back to the default 1500 m target time", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await user.click(choice(/04\s*plan my target pb/i));
    await user.selectOptions(screen.getByLabelText("Target distance"), "5000");
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("Target distance")).toHaveValue("1500");
    expect(screen.getByLabelText("Minutes")).toHaveValue("5");
    expect(screen.getByLabelText("Seconds")).toHaveValue("30");
  });
});
