import type { ToolId } from "../tools/toolTypes";
import type { RhythmMetres } from "./types";
import { METRES_PER_MILE } from "./units";

export type CalculationToolId = Extract<ToolId, "predict" | "pace" | "finish">;

export type EventGroup = "sprint" | "middle" | "long";

export type EventDefinition = {
  id: string;
  label: string;
  metres: number;
  group: EventGroup;
  supportedToolIds: readonly CalculationToolId[];
  splitMetres: readonly RhythmMetres[];
  prediction: {
    route: EventGroup;
  };
};

const METRES_PER_10K = 10_000;

const catalogue = [
  ["100", "100m", 100],
  ["200", "200m", 200],
  ["400", "400m", 400],
  ["600", "600m", 600],
  ["800", "800m", 800],
  ["1000", "1000m", 1000],
  ["1500", "1500m", 1500],
  ["mile", "1 Mile", METRES_PER_MILE],
  ["2000", "2000m", 2000],
  ["3000", "3000m", 3000],
  ["5000", "5000m", 5000],
  ["10k", "10K", METRES_PER_10K],
] as const satisfies readonly (readonly [string, string, number])[];

export function eventGroupFor(metres: number): EventGroup {
  if (metres <= 400) {
    return "sprint";
  }
  if (metres < 3000) {
    return "middle";
  }
  return "long";
}

export function splitDistancesFor(metres: number): readonly RhythmMetres[] {
  const candidates: readonly RhythmMetres[] =
    metres <= 800 ? [100, 200, 400] : metres <= 1000 ? [200, 400] : [400];
  return candidates.filter((split) => split <= metres);
}

export function supportedToolsFor(metres: number): readonly CalculationToolId[] {
  if (metres === 100 || metres === 200 || metres === METRES_PER_10K) {
    return ["predict"];
  }
  return ["predict", "pace", "finish"];
}

export const events: readonly EventDefinition[] = catalogue.map(([id, label, metres]) => {
  const group = eventGroupFor(metres);
  return {
    id,
    label,
    metres,
    group,
    supportedToolIds: supportedToolsFor(metres),
    splitMetres: splitDistancesFor(metres),
    prediction: { route: group },
  };
});

export function eventById(id: string): EventDefinition {
  const event = events.find((candidate) => candidate.id === id);
  if (!event) {
    throw new Error(`Unknown event: ${id}`);
  }
  return event;
}
