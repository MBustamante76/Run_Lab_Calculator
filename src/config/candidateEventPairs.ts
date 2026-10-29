/**
 * Candidate middle-distance directions that still lack an approved empirical
 * event-pair coefficient. Routes covered by the Riegel power-law fallback are
 * not listed here — they return a general one-PB estimate instead of this notice.
 *
 * Kept empty while power law covers 400–1500m pairs; re-add only when a
 * direction should show the soft “not supported yet” notice without a time.
 */
export const candidateEventPairs: ReadonlyArray<readonly [string, string]> = [];

export const candidatePairingNotice = "This event pairing isn't supported yet.";

export function isCandidateEventPair(sourceEventId: string, targetEventId: string): boolean {
  return candidateEventPairs.some(
    ([source, target]) => source === sourceEventId && target === targetEventId,
  );
}
