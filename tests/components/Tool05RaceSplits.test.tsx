import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RunLabCalculatorApp } from "../../src/app/RunLabCalculatorApp";

function choice(name: RegExp) {
  return screen.getByRole("radio", { name });
}

describe("Tool 05 race splits", () => {
  it("builds kilometre checkpoints for a 5000 m goal", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await user.click(choice(/05\s*build my race splits/i));

    await user.selectOptions(screen.getByLabelText("Race distance"), "5000");
    await user.clear(screen.getByLabelText("Minutes"));
    await user.type(screen.getByLabelText("Minutes"), "20");
    await user.clear(screen.getByLabelText("Seconds"));
    await user.type(screen.getByLabelText("Seconds"), "0");
    await user.click(screen.getByRole("button", { name: "Calculate my result" }));

    expect(screen.getByText("1000 m · cumulative").parentElement).toHaveTextContent("4:00.0");
    expect(screen.getByText("3000 m · cumulative").parentElement).toHaveTextContent("12:00.0");
    expect(screen.getByText("Finish · cumulative").parentElement).toHaveTextContent("20:00.0");
    expect(
      screen.getByText(/These are even-pace checkpoint times\. Real races often vary/i),
    ).toBeInTheDocument();
  });

  it("builds 400 m checkpoints for 1500 m", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await user.click(choice(/05\s*build my race splits/i));
    await user.selectOptions(screen.getByLabelText("Race distance"), "1500");
    await user.clear(screen.getByLabelText("Minutes"));
    await user.type(screen.getByLabelText("Minutes"), "5");
    await user.clear(screen.getByLabelText("Seconds"));
    await user.type(screen.getByLabelText("Seconds"), "0");
    await user.click(screen.getByRole("button", { name: "Calculate my result" }));

    expect(screen.getByText("400 m · cumulative").parentElement).toHaveTextContent("1:20.0");
    expect(screen.getByText("1200 m · cumulative").parentElement).toHaveTextContent("4:00.0");
    expect(screen.getByText("Finish · cumulative").parentElement).toHaveTextContent("5:00.0");
  });

  it("builds a 2% negative-split plan for 5000 m", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await user.click(choice(/05\s*build my race splits/i));
    await user.click(screen.getByRole("radio", { name: /Negative split/i }));
    await user.selectOptions(screen.getByLabelText("Checkpoint every"), "1000");
    await user.clear(screen.getByLabelText("Minutes"));
    await user.type(screen.getByLabelText("Minutes"), "20");
    await user.clear(screen.getByLabelText("Seconds"));
    await user.type(screen.getByLabelText("Seconds"), "0");
    await user.click(screen.getByRole("button", { name: "Calculate my result" }));

    expect(screen.getByText("Finish · cumulative").parentElement).toHaveTextContent("20:00.0");
    expect(
      screen.getByText(/These use a 2% negative split: the second half is 2% faster/i),
    ).toBeInTheDocument();
    const firstKm = screen.getByText("1000 m · cumulative").parentElement?.textContent ?? "";
    expect(firstKm).not.toContain("4:00.0");
  });
});
