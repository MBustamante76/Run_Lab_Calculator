import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RunLabCalculatorApp } from "../../src/app/RunLabCalculatorApp";

function choice(name: RegExp) {
  return screen.getByRole("radio", { name });
}

describe("Tool 07 age grade", () => {
  it("shows an age-grade percent for the default male 5K case", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await user.click(choice(/07\s*age-grade my performance/i));

    expect(screen.getByRole("radio", { name: "Male" })).toBeChecked();
    expect(screen.getByLabelText("Age on race day")).toHaveValue(45);
    await user.click(screen.getByRole("button", { name: "Calculate my result" }));

    expect(screen.getByText("Age-grade score").parentElement).toHaveTextContent(/%/);
    expect(screen.getByText("Performance band")).toBeInTheDocument();
    expect(screen.getByText(/USATF MLDR \/ WMA 2025/i)).toBeInTheDocument();
  });
});
