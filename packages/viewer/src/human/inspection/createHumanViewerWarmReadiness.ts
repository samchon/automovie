/**
 * Warm after the host's renderer-policy signal and a source callback whose revision still matches when its delay ends. The historical hardware callback records external admission; it neither queries nor independently proves hardware. Only the last submitted revision suppresses repetition. Delay callbacks compare revision strings, so repeating a revision or returning to an earlier revision before its timer fires can settle from that earlier callback without a full quiet interval after the latest notification.
 *
 * @evidence contracts/common.md#principled-implementation Warming requires the external renderer-policy flag and a settled revision matching the source string at callback time; replacing source withdraws settled authority, but string equality cannot distinguish repeated notifications or an A-to-B-to-A return for delayed settlement.
 * @evidence contracts/common.md#clear-and-simple-design Latest source, settled source and last submitted source separate delayed matching from consecutive duplicate suppression without keeping a source history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hardware arrival alone cannot restore withdrawn settled state and a callback for a different revision returns; a callback with a matching reused revision can still authorize early warming, an unresolved notification-identity limitation.
 * @evidence contracts/common.md#meaningful-documentation The comment states source/renderer-policy prerequisites, last-submitted duplicate suppression and the revision-string limit of delayed checks rather than claiming a measured uninterrupted quiet interval.
 * @evidence contracts/performance.md#efficient-algorithms Each source/hardware transition performs constant-time state checks; callbacks whose revision differs from the current source return without starting warm work.
 * @evidence contracts/performance.md#reuse-equivalent-work Only the same last-submitted revision suppresses duplicate warm submission; a distinct settled revision requests new owner work rather than reusing the older pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Four scalar state fields are retained; delayed callbacks have no cancellation seam or independent pending-count cap and release after firing, while only a differing current revision prevents their settlement effect.
 */
export function createHumanViewerWarmReadiness(
  start: (revision: string) => void,
  options: {
    /** Delay before checking whether a notification's revision still matches; zero starts immediately. */
    stableMs?: number;
    later?: (run: () => void, ms: number) => void;
  } = {},
): { source: (revision: string) => void; hardware: () => void } {
  let source: string | null = null;
  let settled: string | null = null;
  let hardware: boolean = false;
  let submitted: string | null = null;
  const admit: () => void = (): void => {
    if (hardware && settled !== null && settled !== submitted) {
      submitted = settled;
      start(settled);
    }
  };
  return {
    source: (revision: string): void => {
      if (revision === "")
        throw new Error("A warm generation needs a source identity");
      source = revision;
      settled = null;
      const stable: number = options.stableMs ?? 0;
      if (stable <= 0) {
        settled = revision;
        admit();
        return;
      }
      // A matching revision string admits this callback even after a later same-revision notification.
      (
        options.later ??
        ((run: () => void, ms: number): void => {
          setTimeout(run, ms);
        })
      )((): void => {
        if (source !== revision) return;
        settled = revision;
        admit();
      }, stable);
    },
    hardware: (): void => {
      hardware = true;
      admit();
    },
  };
}
