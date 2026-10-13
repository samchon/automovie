/**
 * Start automatic warming only after both source and GPU admission complete.
 * The browser may announce its first iframe before the Node host has read the
 * actual renderer; neither event alone authorizes capture. Each new source
 * generation is submitted once after both prerequisites hold and, when a
 * stable period is set, the revision has not been replaced during it.
 */
export function createHumanViewerWarmReadiness(
  start: (revision: string) => void,
  options: {
    /** A source revision starts warming only after it stood unchanged this long; zero starts at once. */
    stableMs?: number;
    later?: (run: () => void, ms: number) => void;
  } = {},
) {
  let source: string | null = null;
  let settled: string | null = null;
  let hardware = false;
  let submitted: string | null = null;
  const admit = (): void => {
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
      const stable = options.stableMs ?? 0;
      if (stable <= 0) {
        settled = revision;
        admit();
        return;
      }
      // Edits arrive in bursts: only a revision nobody replaced for `stable` ms warms.
      (options.later ?? ((run, ms) => void setTimeout(run, ms)))(() => {
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
