import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RunLabCalculatorApp } from "../../src/app/RunLabCalculatorApp";
import { tools } from "../../src/tools/toolDefinitions";

function choice(name: RegExp) {
  return screen.getByRole("radio", { name });
}

describe("calculator shell", () => {
  it("lists the six final tools and keeps later tools unavailable", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);

    expect(screen.getByRole("heading", { name: "I want to…" })).toBeInTheDocument();
    expect(tools).toHaveLength(6);

    const predict = choice(/01\s*predict my times at other distances/i);
    expect(predict).toHaveAttribute("aria-checked", "true");
    expect(choice(/02\s*calculate my race pace/i)).toHaveAttribute("aria-disabled", "false");
    expect(choice(/03\s*calculate my finishing time/i)).toHaveAttribute("aria-disabled", "false");

    for (const label of [
      /04\s*plan my target pb/i,
      /05\s*build my race splits/i,
      /06\s*discover my performance profile/i,
    ]) {
      const futureTool = choice(label);
      expect(futureTool).toHaveAttribute("aria-disabled", "true");
      expect(futureTool).toHaveTextContent("Future milestone");
      await user.click(futureTool);
    }

    expect(predict).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("heading", { level: 3, name: "Predict my times at other distances" })).toBeInTheDocument();
    expect(screen.getByLabelText("PB distance")).toBeInTheDocument();
    expect(screen.queryByText("Results are not calculated in this version.")).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN|10:59|estimated equivalent/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /book a consultation/i })).not.toBeInTheDocument();
  });

  it("switches the active panel among the enabled tools", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);

    await user.click(choice(/02\s*calculate my race pace/i));
    expect(screen.getByRole("heading", { level: 3, name: "Calculate my race pace" })).toBeInTheDocument();

    await user.click(choice(/03\s*calculate my finishing time/i));
    expect(screen.getByRole("heading", { level: 3, name: "Calculate my finishing time" })).toBeInTheDocument();

    choice(/03\s*calculate my finishing time/i).focus();
    await user.keyboard("{ArrowUp}");
    expect(choice(/02\s*calculate my race pace/i)).toHaveAttribute("aria-checked", "true");
  });

  it("opens and closes the purpose text from the keyboard", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);

    const purpose = screen.getByRole("button", { name: "What is it for?" });
    expect(purpose).toHaveAttribute("aria-expanded", "true");
    purpose.focus();
    await user.keyboard("{Enter}");
    expect(purpose).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/equivalent performance at another distance/i)).not.toBeInTheDocument();
  });
});
