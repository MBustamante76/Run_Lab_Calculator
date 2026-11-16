import type { AgeGradeDistanceId, AgeGradeSex } from "../calculation/ageGrade/ageGrade";
import { events, type CalculationToolId } from "../calculation/events";
import type { PacingStrategy, SplitSpacing } from "../calculation/checkpoints";
import type { PaceUnit } from "../calculation/finishingTime";
import type { ProfileSex } from "../calculation/profile/worldAthleticsPoints";
import { toolIds, type ToolId } from "../tools/toolTypes";

const MAX_MILLISECONDS = 48 * 3_600_000;

export type PredictShare = {
  tool: "predict";
  e1: string;
  t1: number;
  target: string;
  e2?: string;
  t2?: number;
};

export type DistanceTimeShare = {
  tool: "pace" | "target";
  e: string;
  t: number;
};

export type FinishShare = {
  tool: "finish";
  e: string;
  t: number;
  unit: PaceUnit;
};

export type SplitsShare = {
  tool: "splits";
  e: string;
  t: number;
  strategy: PacingStrategy;
  spacing: SplitSpacing;
};

export type ProfileShare = {
  tool: "profile";
  sex: ProfileSex;
  performances: readonly { e: string; t: number }[];
};

export type AgeGradeShare = {
  tool: "ageGrade";
  sex: AgeGradeSex;
  age: number;
  d: AgeGradeDistanceId;
  t: number;
};

export type ShareState =
  | PredictShare
  | DistanceTimeShare
  | FinishShare
  | SplitsShare
  | ProfileShare
  | AgeGradeShare;

const strategies = ["even", "negative"] as const;
const spacings = ["auto", "100", "400", "1000", "mile"] as const;
const paceUnits = ["kilometre", "mile"] as const;
const ageDistances = ["5k", "10k", "half", "marathon"] as const;

export function timeFieldsFromMilliseconds(milliseconds: number, includeHours: boolean) {
  const rounded = Math.round(milliseconds);
  let hours = Math.floor(rounded / 3_600_000);
  let minutes = Math.floor((rounded % 3_600_000) / 60_000);
  const secondMs = rounded % 60_000;
  if (!includeHours) {
    minutes += hours * 60;
    hours = 0;
  }
  const seconds =
    secondMs % 1000 === 0 ? String(secondMs / 1000) : String(Number((secondMs / 1000).toFixed(3)));
  return {
    hours: includeHours && hours > 0 ? String(hours) : "",
    minutes: minutes > 0 || hours > 0 ? String(minutes) : "",
    seconds,
  };
}

function isToolId(value: string): value is ToolId {
  return (toolIds as readonly string[]).includes(value);
}

function eventFor(id: string, tool: CalculationToolId): boolean {
  const event = events.find((candidate) => candidate.id === id);
  return Boolean(event?.supportedToolIds.includes(tool));
}

function millisecondsFrom(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > MAX_MILLISECONDS) {
    return null;
  }
  return parsed;
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  if (!value) {
    return null;
  }
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export function parseShareSearch(search: string): ShareState | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const calc = params.get("calc");
  if (!calc || !isToolId(calc)) {
    return null;
  }

  if (calc === "predict") {
    const e1 = params.get("e1");
    const target = params.get("target");
    const t1 = millisecondsFrom(params.get("t1"));
    if (!e1 || !target || t1 === null || !eventFor(e1, "predict") || !eventFor(target, "predict") || e1 === target) {
      return null;
    }
    const e2 = params.get("e2");
    const t2 = millisecondsFrom(params.get("t2"));
    const second =
      e2 && t2 !== null && eventFor(e2, "predict") && e2 !== e1 && e2 !== target ? { e2, t2 } : {};
    return { tool: "predict", e1, t1, target, ...second };
  }

  if (calc === "pace" || calc === "target") {
    const e = params.get("e");
    const t = millisecondsFrom(params.get("t"));
    if (!e || t === null || !eventFor(e, calc)) {
      return null;
    }
    return { tool: calc, e, t };
  }

  if (calc === "finish") {
    const e = params.get("e");
    const t = millisecondsFrom(params.get("t"));
    const unit = oneOf(params.get("unit"), paceUnits);
    if (!e || t === null || !unit || !eventFor(e, "finish")) {
      return null;
    }
    return { tool: "finish", e, t, unit };
  }

  if (calc === "splits") {
    const e = params.get("e");
    const t = millisecondsFrom(params.get("t"));
    const strategy = oneOf(params.get("strategy"), strategies);
    const spacing = oneOf(params.get("spacing"), spacings);
    if (!e || t === null || !strategy || !spacing || !eventFor(e, "splits")) {
      return null;
    }
    return { tool: "splits", e, t, strategy, spacing };
  }

  if (calc === "profile") {
    const sex = oneOf(params.get("sex"), ["M", "W"] as const);
    const eventsList = params.get("e")?.split(",").filter(Boolean) ?? [];
    const times = params.get("t")?.split(",") ?? [];
    if (!sex || eventsList.length < 2 || eventsList.length > 6 || eventsList.length !== times.length) {
      return null;
    }
    if (new Set(eventsList).size !== eventsList.length) {
      return null;
    }
    const performances = eventsList.map((eventId, index) => ({
      e: eventId,
      t: millisecondsFrom(times[index] ?? null),
    }));
    if (performances.some((row) => row.t === null || !eventFor(row.e, "profile"))) {
      return null;
    }
    return {
      tool: "profile",
      sex,
      performances: performances.map((row) => ({ e: row.e, t: row.t as number })),
    };
  }

  const sex = oneOf(params.get("sex"), ["M", "W"] as const);
  const age = Number(params.get("age"));
  const d = oneOf(params.get("d"), ageDistances);
  const t = millisecondsFrom(params.get("t"));
  if (!sex || !d || t === null || !Number.isInteger(age) || age < 5 || age > 100) {
    return null;
  }
  return { tool: "ageGrade", sex, age, d, t };
}

export function serializeShareState(state: ShareState): string {
  const params = new URLSearchParams();
  params.set("calc", state.tool);
  if (state.tool === "predict") {
    params.set("e1", state.e1);
    params.set("t1", String(state.t1));
    if (state.e2 && state.t2) {
      params.set("e2", state.e2);
      params.set("t2", String(state.t2));
    }
    params.set("target", state.target);
  } else if (state.tool === "pace" || state.tool === "target") {
    params.set("e", state.e);
    params.set("t", String(state.t));
  } else if (state.tool === "finish") {
    params.set("e", state.e);
    params.set("t", String(state.t));
    params.set("unit", state.unit);
  } else if (state.tool === "splits") {
    params.set("e", state.e);
    params.set("t", String(state.t));
    params.set("strategy", state.strategy);
    params.set("spacing", state.spacing);
  } else if (state.tool === "profile") {
    params.set("sex", state.sex);
    params.set("e", state.performances.map((row) => row.e).join(","));
    params.set("t", state.performances.map((row) => String(row.t)).join(","));
  } else if (state.tool === "ageGrade") {
    params.set("sex", state.sex);
    params.set("age", String(state.age));
    params.set("d", state.d);
    params.set("t", String(state.t));
  }
  return params.toString();
}

declare global {
  interface Window {
    runLabCalculatorConfig?: {
      shareBaseUrl?: unknown;
    };
  }
}

/** Page URL that shared links should open (WordPress page, or VITE_SHARE_BASE_URL in local Vite). */
export function shareBaseHref(fallback = window.location.href): string {
  const fromHost = window.runLabCalculatorConfig?.shareBaseUrl;
  if (typeof fromHost === "string" && fromHost.trim() !== "") {
    return fromHost.trim();
  }
  const fromEnv = import.meta.env.VITE_SHARE_BASE_URL;
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") {
    return fromEnv.trim();
  }
  return fallback;
}

export function buildShareUrl(state: ShareState, href = shareBaseHref()): string {
  const url = new URL(href);
  url.search = serializeShareState(state);
  url.hash = "";
  return url.toString();
}

const MAX_CARD_LINES = 6;
const MAX_CARD_LINE_LENGTH = 80;

/** Short on-screen lines used only for the link-preview image. */
export function shareCardLines(lines: readonly string[]): string[] {
  return lines
    .map((line) => line.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim())
    .filter((line) => line !== "")
    .slice(0, MAX_CARD_LINES)
    .map((line) => line.slice(0, MAX_CARD_LINE_LENGTH));
}

/** Adds preview text without changing the parameters that restore the calculator. */
export function appendShareCardLines(href: string, lines: readonly string[]): string {
  const url = new URL(href);
  const cleaned = shareCardLines(lines);
  if (cleaned.length > 0) {
    url.searchParams.set("card", cleaned.join("\n"));
  }
  return url.toString();
}
