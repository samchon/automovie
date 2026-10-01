/**
 * Start automatic warming only after both source and GPU admission complete.
 * The browser may announce its first iframe before the Node host has read the
 * actual renderer; neither event alone authorizes capture. Each new source
 * generation is submitted once after both prerequisites hold.
 *
 * @evidence contracts/common.md#principled-implementation Conjoining independent source and hardware admission removes the startup ordering race without delaying or retrying rejected captures.
 * @evidence contracts/common.md#clear-and-simple-design One owner remembers the two prerequisites and the last submitted generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readiness comes from actual source and renderer events, not a time allowance or document-specific exception.
 * @evidence contracts/common.md#meaningful-documentation Explains the possible event orders and one submission per generation.
 */
export function createHumanViewerWarmReadiness(start: (revision: string) => void) {
  let source: string | null = null;
  let hardware = false;
  let submitted: string | null = null;
  const admit = (): void => {
    if (hardware && source !== null && source !== submitted) {
      submitted = source;
      start(source);
    }
  };
  return {
    source: (revision: string): void => {
      if (revision === "") throw new Error("A warm generation needs a source identity");
      source = revision;
      admit();
    },
    hardware: (): void => {
      hardware = true;
      admit();
    },
  };
}
