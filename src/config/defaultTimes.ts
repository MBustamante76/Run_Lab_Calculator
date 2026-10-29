/**
 * Illustrative healthy, reasonably fit runner benchmarks from
 * RUN-LAB_Caluculator_Default_Times.xlsx — not population averages.
 * Used to pre-fill finishing-time fields when a distance is selected.
 */
export type DefaultStructuredTime = {
  hours: string;
  minutes: string;
  seconds: string;
};

const defaultsByEventId: Readonly<Record<string, DefaultStructuredTime>> = {
  "100": { hours: "", minutes: "0", seconds: "15" },
  "200": { hours: "", minutes: "0", seconds: "30" },
  "400": { hours: "", minutes: "1", seconds: "10" },
  "600": { hours: "", minutes: "1", seconds: "55" },
  "800": { hours: "", minutes: "2", seconds: "40" },
  "1000": { hours: "", minutes: "3", seconds: "30" },
  "1500": { hours: "", minutes: "5", seconds: "30" },
  mile: { hours: "", minutes: "6", seconds: "0" },
  "2000": { hours: "", minutes: "7", seconds: "30" },
  "3000": { hours: "", minutes: "12", seconds: "0" },
  "5000": { hours: "", minutes: "22", seconds: "0" },
  "10k": { hours: "", minutes: "45", seconds: "0" },
};

export function defaultTimeForEvent(eventId: string): DefaultStructuredTime {
  return defaultsByEventId[eventId] ?? { hours: "", minutes: "", seconds: "" };
}
