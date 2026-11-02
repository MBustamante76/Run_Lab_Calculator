import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RunLabCalculatorApp } from "../../src/app/RunLabCalculatorApp";

function choice(name: RegExp) {
  return screen.getByRole("radio", { name });
}

describe("Tool 06 performance profile", () => {
  it("scores two PBs and highlights the strongest", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await user.click(choice(/06\s*discover my performance profile/i));

    expect(screen.getByRole("radio", { name: "Men" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Calculate my result" }));

    expect(screen.getAllByText(/\d+ pts/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Strongest ·/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Points use the World Athletics outdoor scoring tables/i),
    ).toBeInTheDocument();
  });

  it("lets the user add a third PB and switch to women tables", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await user.click(choice(/06\s*discover my performance profile/i));
    await user.click(screen.getByRole("button", { name: "+ Add another PB" }));
    expect(screen.getByLabelText("PB 3 distance")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Women" }));
    await user.click(screen.getByRole("button", { name: "Calculate my result" }));
    expect(screen.getAllByText(/\d+ pts/).length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/\(women\)/i)).toBeInTheDocument();
  });
});
