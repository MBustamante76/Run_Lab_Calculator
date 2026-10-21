import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RunLabCalculatorApp } from "../../src/app/RunLabCalculatorApp";
import { predictPerformance } from "../../src/calculation/prediction/PredictionEngine";
import { calculateRaceMetrics, presentRaceMetrics } from "../../src/calculation/raceMetrics";
import { eventById } from "../../src/calculation/events";

const user = userEvent.setup;

function timeFields(name: string) {
  const group = screen.getByRole("group", { name });
  return {
    minutes: within(group).getByLabelText("Minutes"),
    seconds: within(group).getByLabelText("Seconds"),
  };
}

async function enterTime(name: string, minutes: string, seconds: string) {
  const fields = timeFields(name);
  await user().clear(fields.minutes);
  await user().type(fields.minutes, minutes);
  await user().clear(fields.seconds);
  await user().type(fields.seconds, seconds);
}

async function enterAnchors() {
  await user().selectOptions(screen.getByLabelText("PB distance"), "200");
  await enterTime("PB time", "0", "25");
  await user().click(screen.getByRole("button", { name: "+ Add another PB" }));
  await user().selectOptions(screen.getByLabelText("Second PB distance"), "800");
  await enterTime("Second PB time", "2", "10");
}

describe("Tool 01 prediction", () => {
  it("estimates 400m from 200m and 800m and names both anchors", async () => {
    render(<RunLabCalculatorApp />);
    await enterAnchors();
    await user().selectOptions(screen.getByLabelText("Target distance"), "400");
    await user().click(screen.getByRole("button", { name: "Calculate my result" }));

    expect(screen.getByText("Estimated equivalent performance").parentElement).toHaveTextContent("57.0");
    expect(screen.getByText("Based on your two PBs")).toBeInTheDocument();
    expect(screen.queryByText("1.0.0")).not.toBeInTheDocument();

    await user().click(screen.getByRole("button", { name: "How was this calculated?" }));
    expect(screen.getByText(/200m PB of 25\.0/)).toBeInTheDocument();
    expect(screen.getByText(/800m PB of 2:10\.0/)).toBeInTheDocument();
  });

  it("estimates 600m from the same anchors", async () => {
    render(<RunLabCalculatorApp />);
    await enterAnchors();
    await user().selectOptions(screen.getByLabelText("Target distance"), "600");
    await user().click(screen.getByRole("button", { name: "Calculate my result" }));

    expect(screen.getByText("Estimated equivalent performance").parentElement).toHaveTextContent("1:32.3");
    expect(screen.getByText("Based on your two PBs")).toBeInTheDocument();
  });

  it("does not extrapolate 200m and 800m to 5000m", async () => {
    render(<RunLabCalculatorApp />);
    await enterAnchors();
    await user().selectOptions(screen.getByLabelText("Target distance"), "5000");
    await user().click(screen.getByRole("button", { name: "Calculate my result" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "We need a more relevant PB to estimate this distance reliably. Add a second PB closer to the target distance, or choose a nearer event.",
    );
    expect(screen.queryByText("Estimated equivalent performance")).not.toBeInTheDocument();
    expect(screen.queryByText("Based on your two PBs")).not.toBeInTheDocument();
  });

  it("returns no time for a 100m PB and a 10K target", async () => {
    render(<RunLabCalculatorApp />);
    await user().selectOptions(screen.getByLabelText("PB distance"), "100");
    await enterTime("PB time", "0", "12.5");
    await user().selectOptions(screen.getByLabelText("Target distance"), "10k");
    await user().click(screen.getByRole("button", { name: "Calculate my result" }));

    expect(screen.getByRole("status")).toHaveTextContent("more relevant PB");
    expect(screen.queryByText("Estimated equivalent performance")).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+:\d+/)).not.toBeInTheDocument();
  });

  it("scales 1500m to 3000m with the friendly label and shared pace", async () => {
    render(<RunLabCalculatorApp />);
    await enterTime("PB time", "4", "30");
    await user().click(screen.getByRole("button", { name: "Calculate my result" }));

    expect(screen.getByText("Estimated equivalent performance").parentElement).toHaveTextContent("9:22.9");
    expect(screen.getByText("Middle and long-distance scaling")).toBeInTheDocument();
    expect(screen.queryByText("1.06-1.0.0")).not.toBeInTheDocument();
    expect(screen.getByText(/similar level of endurance/)).toBeInTheDocument();

    const prediction = predictPerformance({
      performances: [{ eventId: "1500", milliseconds: 270_000 }],
      targetEventId: "3000",
    });
    if (prediction.status !== "success") {
      throw new Error("Expected a prediction.");
    }
    const metrics = calculateRaceMetrics(eventById("3000").metres, prediction.predictedTimeMilliseconds);
    if (!metrics.ok) {
      throw new Error("Expected metrics.");
    }
    expect(screen.getByText("Pace per km").parentElement).toHaveTextContent(
      presentRaceMetrics(metrics.value).pacePerKilometre,
    );
    expect(screen.getByText("Average 400 m")).toBeInTheDocument();
    expect(screen.getByText("These are average values over the full distance.")).toBeInTheDocument();
  });

  it("warns when the target is outside the two PBs and an approved route exists", async () => {
    render(<RunLabCalculatorApp />);
    await enterTime("PB time", "4", "30");
    await user().click(screen.getByRole("button", { name: "+ Add another PB" }));
    await user().selectOptions(screen.getByLabelText("Second PB distance"), "3000");
    await enterTime("Second PB time", "9", "30");
    await user().selectOptions(screen.getByLabelText("Target distance"), "5000");
    await user().click(screen.getByRole("button", { name: "Calculate my result" }));

    expect(screen.getByText("Middle and long-distance scaling")).toBeInTheDocument();
    expect(screen.getByText(/3000m PB only/)).toBeInTheDocument();
  });

  it("removes a PB distance from the other PB and from the target", async () => {
    render(<RunLabCalculatorApp />);
    await user().selectOptions(screen.getByLabelText("PB distance"), "200");
    await user().click(screen.getByRole("button", { name: "+ Add another PB" }));

    expect(within(screen.getByLabelText("Second PB distance")).queryByRole("option", { name: "200m" })).toBeNull();
    expect(within(screen.getByLabelText("Target distance")).queryByRole("option", { name: "200m" })).toBeNull();
    expect(within(screen.getByLabelText("Target distance")).queryByRole("option", { name: "800m" })).toBeNull();
  });

  it("moves the target when the PB changes to the same distance", async () => {
    render(<RunLabCalculatorApp />);
    await user().selectOptions(screen.getByLabelText("PB distance"), "3000");
    expect(screen.getByLabelText("Target distance")).not.toHaveValue("3000");
    expect(within(screen.getByLabelText("Target distance")).queryByRole("option", { name: "3000m" })).toBeNull();
  });

  it("keeps the entered time when seconds are invalid", async () => {
    render(<RunLabCalculatorApp />);
    await enterTime("PB time", "4", "60");
    await user().click(screen.getByRole("button", { name: "Calculate my result" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Seconds must be less than 60.");
    expect(timeFields("PB time").seconds).toHaveValue("60");
    expect(timeFields("PB time").minutes).toHaveValue("4");
    expect(screen.queryByText("Estimated equivalent performance")).not.toBeInTheDocument();
  });

  it("asks for the second PB time and keeps the first PB", async () => {
    render(<RunLabCalculatorApp />);
    await enterTime("PB time", "4", "30");
    await user().click(screen.getByRole("button", { name: "+ Add another PB" }));
    await user().click(screen.getByRole("button", { name: "Calculate my result" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter the minutes.");
    expect(timeFields("PB time").minutes).toHaveValue("4");
    expect(timeFields("PB time").seconds).toHaveValue("30");
    expect(screen.queryByText("Estimated equivalent performance")).not.toBeInTheDocument();
  });

  it("keeps PB 1 when the second PB is removed", async () => {
    render(<RunLabCalculatorApp />);
    await enterTime("PB time", "4", "30");
    await user().click(screen.getByRole("button", { name: "+ Add another PB" }));
    await enterTime("Second PB time", "2", "0");
    await user().click(screen.getByRole("button", { name: "Remove second PB" }));

    expect(screen.queryByLabelText("Second PB distance")).not.toBeInTheDocument();
    expect(timeFields("PB time").minutes).toHaveValue("4");
    expect(timeFields("PB time").seconds).toHaveValue("30");
    expect(screen.getByRole("button", { name: "+ Add another PB" })).toBeInTheDocument();
  });

  it("softens unsupported candidate middle-distance pairings without inventing a time", async () => {
    render(<RunLabCalculatorApp />);
    await user().selectOptions(screen.getByLabelText("PB distance"), "800");
    await enterTime("PB time", "2", "0");
    await user().selectOptions(screen.getByLabelText("Target distance"), "1500");
    await user().click(screen.getByRole("button", { name: "Calculate my result" }));

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(
      "We need a more relevant PB to estimate this distance reliably. Add a second PB closer to the target distance, or choose a nearer event.",
    );
    expect(status).toHaveTextContent("This event pairing isn't supported yet.");
    expect(screen.queryByText("Estimated equivalent performance")).not.toBeInTheDocument();
    expect(screen.queryByText("--:--")).not.toBeInTheDocument();
  });

  it("resets the prediction and clears it when another tool is selected", async () => {
    render(<RunLabCalculatorApp />);
    await enterAnchors();
    await user().selectOptions(screen.getByLabelText("Target distance"), "400");
    await user().click(screen.getByRole("button", { name: "Calculate my result" }));
    const estimate = screen.getByText("Estimated equivalent performance").parentElement;
    expect(estimate).toHaveTextContent("57.0");

    await user().click(screen.getByRole("button", { name: "Reset" }));
    expect(timeFields("PB time").minutes).toHaveValue("");
    expect(screen.queryByLabelText("Second PB distance")).not.toBeInTheDocument();
    expect(screen.queryByText("57.0")).not.toBeInTheDocument();

    await enterAnchors();
    await user().selectOptions(screen.getByLabelText("Target distance"), "400");
    await user().click(screen.getByRole("button", { name: "Calculate my result" }));
    await user().click(screen.getByRole("radio", { name: /02\s*calculate my race pace/i }));
    await user().click(screen.getByRole("radio", { name: /01\s*predict my times at other distances/i }));
    expect(screen.queryByText("57.0")).not.toBeInTheDocument();
    expect(timeFields("PB time").minutes).toHaveValue("");
  });

  it("keeps the prediction formula out of the form component", () => {
    const source = readFileSync("src/tools/Tool01Predict.tsx", "utf8");
    expect(source).not.toContain("1.06");
    expect(source).not.toContain("1609.344");
    expect(source).toContain("predictPerformance");
    expect(source).toContain("calculateRaceMetrics");
  });
});
