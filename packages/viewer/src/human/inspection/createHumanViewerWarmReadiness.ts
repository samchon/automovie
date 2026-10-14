/**
 * Warm only after source settlement and the host's renderer-policy signal. The historical hardware callback records that external admission; it neither queries nor independently proves hardware. Each current source is submitted once after both prerequisites and its optional unchanged stable interval hold.
 *
 * @evidence contracts/common.md#principled-implementation Warming requires the external renderer-policy flag and latest source revision's settled stable period; replacing source withdraws the older settled authority immediately.
 * @evidence contracts/common.md#clear-and-simple-design Latest source, settled source and last submitted source separate debounce authority from one-time warm submission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hardware arrival cannot warm an older settled revision while a replacement is still stabilizing, and stale delayed callbacks do not authorize another source.
 * @evidence contracts/common.md#meaningful-documentation The comment states dual source/GPU prerequisites, generation submission and stable-period replacement checks.
 * @evidence contracts/performance.md#efficient-algorithms Each source/hardware transition performs constant-time state checks; obsolete timer callbacks return without starting warm work.
 * @evidence contracts/performance.md#reuse-equivalent-work Only the same last-submitted revision suppresses duplicate warm submission; a distinct settled revision requests new owner work rather than reusing the older pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Four scalar state fields are retained; delayed callbacks have no cancellation seam or independent pending-count cap, though obsolete ones release after their stable delay and cannot publish.
 */
export function createHumanViewerWarmReadiness(
  start: (revision: string) => void,
  options: {
    /** A source revision starts warming only after it stood unchanged this long; zero starts at once. */
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
      // Edits arrive in bursts: only a revision nobody replaced for `stable` ms warms.
      (options.later ?? ((run: () => void, ms: number): void => { setTimeout(run, ms); }))((): void => {
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
