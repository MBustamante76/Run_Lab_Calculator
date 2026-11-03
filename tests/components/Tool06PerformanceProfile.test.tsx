import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RunLabCalculatorApp } from "../../src/app/RunLabCalculatorApp";

function choice(name: RegExp) {
  return screen.getByRole("radio", { name });
}

describe("Tool 06 performance profile", () => {
  it("scores two PBs and shows gauge, chart and interpretation", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await user.click(choice(/06\s*discover my performance profile/i));

    expect(screen.getByRole("radio", { name: "Male" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Calculate my result" }));

    expect(screen.queryByLabelText("PB 1 distance")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Calculate my result" })).not.toBeInTheDocument();
    expect(screen.getByText(/Strongest performance|Leading performances/i)).toBeInTheDocument();
    expect(screen.getByText("Relative profile")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Relative profile gauge/i })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /World Athletics score chart/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Interpretation")).toBeInTheDocument();
    expect(
      screen.getByText(/Performance comparison based on World Athletics Scoring Tables/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit performances" }));
    expect(screen.getByLabelText("PB 1 distance")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Calculate my result" })).toBeInTheDocument();
  });

  it("lets the user add a third PB and switch to female tables", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await user.click(choice(/06\s*discover my performance profile/i));
    await user.click(screen.getByRole("button", { name: "+ Add another performance" }));
    expect(screen.getByLabelText("PB 3 distance")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Female" }));
    await user.click(screen.getByRole("button", { name: "Calculate my result" }));
    expect(screen.getByText(/\(female\)/i)).toBeInTheDocument();
    expect(screen.getByText("Interpretation").closest("div")).toHaveTextContent(/currently/i);
  });

  it("offers 100m on Tool 06 and allows up to six performances", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await user.click(choice(/06\s*discover my performance profile/i));
    expect(
      within(screen.getByLabelText("PB 1 distance")).getByRole("option", { name: "100m" }),
    ).toBeInTheDocument();

    for (let count = 2; count < 6; count += 1) {
      await user.click(screen.getByRole("button", { name: "+ Add another performance" }));
      expect(screen.getByLabelText(`PB ${count + 1} distance`)).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "+ Add another performance" })).not.toBeInTheDocument();
  });
});
