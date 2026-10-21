import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RunLabCalculatorApp } from "../../src/app/RunLabCalculatorApp";
import { eventById } from "../../src/calculation/events";
import { presentRaceMetrics, calculateRaceMetrics } from "../../src/calculation/raceMetrics";
import { parseStructuredTime } from "../../src/calculation/time";

function choice(name: RegExp) {
  return screen.getByRole("radio", { name });
}

async function openPace(user: ReturnType<typeof userEvent.setup>) {
  await user.click(choice(/02\s*calculate my race pace/i));
}

async function calculate(user: ReturnType<typeof userEvent.setup>, minutes: string, seconds: string) {
  await user.clear(screen.getByLabelText("Minutes"));
  await user.type(screen.getByLabelText("Minutes"), minutes);
  await user.clear(screen.getByLabelText("Seconds"));
  await user.type(screen.getByLabelText("Seconds"), seconds);
  await user.click(screen.getByRole("button", { name: "Calculate my result" }));
}

describe("Tool 02 race pace", () => {
  it("calculates 5000 m in 20:00 and shows only the meaningful rhythm", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await openPace(user);
    await calculate(user, "20", "0");

    const result = screen.getByText("Pace per km").parentElement;
    expect(result).toHaveTextContent("4:00");
    expect(result).toHaveClass("run-lab-calculator__metric--primary");
    expect(screen.getByText("Pace per mile").parentElement).toHaveTextContent("6:26");
    expect(screen.getByText("Pace per mile").parentElement).not.toHaveClass(
      "run-lab-calculator__metric--primary",
    );
    expect(screen.getByText("Speed km/h").parentElement).toHaveTextContent("15.00");
    expect(screen.getByText("Average 400 m").parentElement).toHaveTextContent("1:36.0");
    expect(screen.getByText("These are average values over the full distance.")).toBeInTheDocument();
    expect(screen.queryByText("Average 100 m")).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "100m" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "10K" })).not.toBeInTheDocument();
  });

  it("uses the mile event length of 1609.344 m", async () => {
    expect(eventById("mile").metres).toBe(1609.344);
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await openPace(user);
    await user.selectOptions(screen.getByLabelText("Race distance"), "mile");
    await calculate(user, "4", "0");

    const parsed = parseStructuredTime({ minutes: 4, seconds: 0 });
    if (!parsed.ok) {
      throw new Error("Expected a valid time.");
    }
    const metrics = calculateRaceMetrics(eventById("mile").metres, parsed.value.milliseconds);
    if (!metrics.ok) {
      throw new Error("Expected metrics.");
    }
    expect(screen.getByText("Pace per mile").parentElement).toHaveTextContent(
      presentRaceMetrics(metrics.value).pacePerMile,
    );
    expect(presentRaceMetrics(metrics.value).pacePerMile).toBe("4:00");
  });

  it("keeps a fractional second in the calculated rhythm", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await openPace(user);
    await user.selectOptions(screen.getByLabelText("Race distance"), "400");
    await calculate(user, "1", "4.25");

    expect(screen.getByText("Average 400 m").parentElement).toHaveTextContent("1:04.3");
    expect(screen.getByText("Pace per km").parentElement).toHaveTextContent("2:41");
  });

  it("rejects 60 seconds and removes an earlier result", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await openPace(user);
    await calculate(user, "20", "0");
    expect(screen.getByText("4:00")).toBeInTheDocument();

    await calculate(user, "1", "60");
    expect(screen.getByRole("alert")).toHaveTextContent("Seconds must be less than 60.");
    expect(screen.queryByText("4:00")).not.toBeInTheDocument();
  });

  it("returns the same result when calculated again", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await openPace(user);
    await calculate(user, "20", "0");
    const first = screen.getByText("Pace per km").parentElement?.textContent;
    await user.click(screen.getByRole("button", { name: "Calculate my result" }));
    expect(screen.getByText("Pace per km").parentElement?.textContent).toBe(first);
  });

  it("resets the form and the result", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await openPace(user);
    await calculate(user, "20", "0");
    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByLabelText("Minutes")).toHaveValue("");
    expect(screen.getByLabelText("Seconds")).toHaveValue("");
    expect(screen.queryByText("4:00")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("clears pace results and errors when another tool is selected", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await openPace(user);
    await calculate(user, "1", "60");
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.click(choice(/03\s*calculate my finishing time/i));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("4:00")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Per kilometre" })).toBeChecked();

    await openPace(user);
    await calculate(user, "20", "0");
    await user.click(choice(/01\s*predict my times at other distances/i));
    expect(screen.queryByText("4:00")).not.toBeInTheDocument();
    expect(screen.queryByText("Pace per km")).not.toBeInTheDocument();
  });

  it("shows 800 m rhythms and hides them again for 5000 m", async () => {
    const user = userEvent.setup();
    render(<RunLabCalculatorApp />);
    await openPace(user);
    await user.selectOptions(screen.getByLabelText("Race distance"), "800");
    await calculate(user, "2", "0");

    const result = screen.getByText("These are average values over the full distance.").closest("div");
    if (!result) {
      throw new Error("Expected a result.");
    }
    expect(within(result).getByText("Average 100 m")).toBeInTheDocument();
    expect(within(result).getByText("Average 200 m")).toBeInTheDocument();
    expect(within(result).getByText("15.0")).toBeInTheDocument();
    expect(within(result).getByText("30.0")).toBeInTheDocument();
    expect(within(result).getByText("1:00.0")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Race distance"), "5000");
    await user.click(screen.getByRole("button", { name: "Calculate my result" }));
    expect(screen.queryByText("Average 100 m")).not.toBeInTheDocument();
    expect(screen.getByText("Average 400 m")).toBeInTheDocument();
  });

  it("does not put pace formulae in the React component", () => {
    const source = readFileSync("src/tools/Tool02RacePace.tsx", "utf8");
    expect(source).not.toContain("1609.344");
    expect(source).not.toContain("/ 1000");
    expect(source).toContain("calculateRaceMetrics");
  });
});
