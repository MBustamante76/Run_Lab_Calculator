/**
 * Candidate middle-distance directions awaiting methodology approval.
 * Not enabled in production. Used only for softer unsupported UI copy.
 */
export const candidateEventPairs = [
  ["400", "800"],
  ["800", "400"],
  ["600", "800"],
  ["800", "600"],
  ["800", "1500"],
  ["1500", "800"],
] as const;

export const candidatePairingNotice = "This event pairing isn't supported yet.";

export function isCandidateEventPair(sourceEventId: string, targetEventId: string): boolean {
  return candidateEventPairs.some(
    ([source, target]) => source === sourceEventId && target === targetEventId,
  );
}
