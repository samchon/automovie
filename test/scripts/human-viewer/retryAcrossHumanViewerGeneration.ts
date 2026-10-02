/** The refusals a request gets when the page generation it ran on was replaced. */
const CHANGE_MESSAGES = [
  "Source changed during capture",
  "Source changed during request",
  "Source changed during sheet capture",
  "The source generation was replaced during display",
  "The source revision has not finished loading",
];

/**
 * Whether an error only says that the source generation changed while a
 * request ran. The page raises these messages across a process boundary, so
 * they are recognised by their text, kept here as the single list.
 */
export const isHumanViewerGenerationChange = (error: unknown): boolean => {
  const text = error instanceof Error ? error.message : String(error);
  return CHANGE_MESSAGES.some((message) => text.includes(message));
};

/**
 * Run a capture again on the generation that replaced the one it started on.
 * A request that arrives while the source rebuilds, or straddles the moment a
 * new generation is published, fails only because two generations met; the
 * capture is idempotent and writes its response after it succeeds, so running
 * it again on the settled generation answers the same question. `settle`
 * waits until a generation can draw again, and the attempts are bounded so a
 * source that keeps changing still ends in the last refusal. Any other error
 * is returned at once, unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Idempotent work re-run after an explicit settle on a named class of refusal, bounded in attempts.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the retry and one list names the refusals it covers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retries only the generation-change refusals, never a failed build, and keeps the stale-header contract of the settled generation.
 * @evidence contracts/common.md#meaningful-documentation States why the refusal is transient, the idempotence precondition and the bound.
 */
export async function retryAcrossHumanViewerGeneration<T>(
  run: () => Promise<T>,
  props: { settle: () => Promise<void>; attempts: number },
): Promise<T> {
  for (let attempt = 1; ; ++attempt) {
    try {
      return await run();
    } catch (error) {
      if (attempt >= props.attempts || !isHumanViewerGenerationChange(error))
        throw error;
      await props.settle();
    }
  }
}
