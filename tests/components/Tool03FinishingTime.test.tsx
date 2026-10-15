import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RunLabCalculatorApp } from "../../src/app/RunLabCalculatorApp";
import { presentFinishingTime, finishingTimeMetrics } from "../../src/calculation/finishingTime";
import { parseStructuredTime } from "../../src/calculation/time";

function choice(name: RegExp) {
  return screen.getByRole("radio", { name });
}

async function openFinish(user: ReturnType<typeof userEvent.setup>) {
  await user.click(choice(/03\s*calculate my finishing time/i));
}

async function enterPace(user: ReturnType<typeof userEvent.setup>, minutes: string, seconds: string) {
  await user.clear(screen.getByLabelText("Minutes"));
  await user.type(screen.getByLabelText("Minutes"), minutes);
  await user.clear(screen.getByLabelText("Seconds"));
  if (seconds !== "") {
    await user.type(screen.getByLabelText("Seconds"), seconds);
  }
  await user.click(screen.getByRole("button", { name: "Calculate my result" }));
}

describe("Tool 03 finishing time", () => {
  it("calculates 3000 m at 4:10 per km as 12:30", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await openFinish(user);

    expect(screen.getByLabelText("Race distance")).toHaveValue("3000");
    expect(screen.getByRole("radio", { name: "Per kilometre" })).toBeChecked();
    expect(screen.getByLabelText("Minutes")).not.toHaveAttribute("placeholder");
    expect(screen.getByLabelText("Seconds")).toHaveAttribute("inputMode", "decimal");

    await enterPace(user, "4", "10");

    const result = screen.getByText("Finishing time").parentElement?.parentElement;
    expect(result).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Finishing time").parentElement).toHaveTextContent("12:30");
    expect(screen.getByText("Pace per km").parentElement).toHaveTextContent("4:10");
    expect(
      screen.getByText("This assumes the entered average pace is maintained for the full distance."),
    ).toBeInTheDocument();

    const parsed = parseStructuredTime({ minutes: 4, seconds: 10 });
    if (!parsed.ok) {
      throw new Error("Expected a valid pace.");
    }
    const metrics = finishingTimeMetrics(3000, parsed.value.milliseconds, "kilometre");
    if (!metrics.ok) {
      throw new Error("Expected metrics.");
    }
    expect(screen.getByText("Pace per mile").parentElement).toHaveTextContent(
      presentFinishingTime(metrics.value, "kilometre").convertedPace,
    );
  });

  it("calculates a mile at 8:00 per mile as 8:00 and updates the unit label", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await openFinish(user);
    await user.selectOptions(screen.getByLabelText("Race distance"), "mile");
    await user.click(screen.getByRole("radio", { name: "Per mile" }));
    expect(screen.getByRole("radio", { name: "Per mile" })).toBeChecked();
    await enterPace(user, "8", "0");

    expect(screen.getByText("Finishing time").parentElement).toHaveTextContent("8:00");
    expect(screen.getByText("Pace per mile").parentElement).toHaveTextContent("8:00");
    expect(screen.getByText("Pace per km")).toBeInTheDocument();
  });

  it("rejects blank, zero, negative, 60 seconds and malformed pace without clearing a valid field", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await openFinish(user);

    await user.click(screen.getByRole("button", { name: "Calculate my result" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter the minutes.");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter the seconds.");

    await enterPace(user, "0", "0");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a time greater than zero.");
    expect(screen.getByLabelText("Minutes")).toHaveValue("0");

    await enterPace(user, "-1", "0");
    expect(screen.getByRole("alert")).toHaveTextContent("Minutes cannot be negative.");
    expect(screen.getByLabelText("Minutes")).toHaveValue("-1");

    await enterPace(user, "4", "60");
    expect(screen.getByRole("alert")).toHaveTextContent("Seconds must be less than 60.");
    expect(screen.getByLabelText("Minutes")).toHaveValue("4");
    expect(screen.getByLabelText("Seconds")).toHaveValue("60");

    await enterPace(user, "4:10", "0");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter the minutes as a number.");
    expect(screen.getByLabelText("Seconds")).toHaveValue("0");
  });

  it("returns the same finishing time when calculated again", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await openFinish(user);
    await enterPace(user, "4", "10");
    const first = screen.getByText("Finishing time").parentElement?.textContent;
    await user.click(screen.getByRole("button", { name: "Calculate my result" }));
    expect(screen.getByText("Finishing time").parentElement?.textContent).toBe(first);
  });

  it("resets the pace fields and the result", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await openFinish(user);
    await user.click(screen.getByRole("radio", { name: "Per mile" }));
    await enterPace(user, "4", "10");
    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByLabelText("Minutes")).toHaveValue("");
    expect(screen.getByLabelText("Seconds")).toHaveValue("");
    expect(screen.getByLabelText("Race distance")).toHaveValue("3000");
    expect(screen.getByRole("radio", { name: "Per kilometre" })).toBeChecked();
    expect(screen.queryByText("12:30")).not.toBeInTheDocument();
  });

  it("does not keep a finishing time after switching tools", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await openFinish(user);
    await enterPace(user, "4", "10");
    expect(screen.getByText("12:30")).toBeInTheDocument();

    await user.click(choice(/02\s*calculate my race pace/i));
    expect(screen.queryByText("12:30")).not.toBeInTheDocument();
    expect(screen.queryByText("Finishing time")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Per kilometre" })).not.toBeInTheDocument();

    await openFinish(user);
    expect(screen.getByLabelText("Minutes")).toHaveValue("");
    expect(screen.queryByText("12:30")).not.toBeInTheDocument();
  });

  it("does not put the finishing formula in the React component", () => {
    const source = readFileSync("src/tools/Tool03FinishingTime.tsx", "utf8");
    expect(source).not.toContain("1609.344");
    expect(source).not.toContain("*");
    expect(source).toContain("finishingTimeMetrics");
  });
});
