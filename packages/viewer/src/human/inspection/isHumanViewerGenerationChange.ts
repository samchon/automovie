/** The refusals a request gets when the page generation it ran on was replaced. */
const CHANGE_MESSAGES: readonly string[] = [
  "Source changed during capture",
  "Source changed during request",
  "Source changed during sheet capture",
  "The source generation was replaced during display",
  "The source revision has not finished loading",
  // The page read a catalogue of a newer source generation than it loaded.
  "The document inventory belongs to a newer source generation",
  // The page reloaded while a call ran in it (Playwright's own wording).
  "Execution context was destroyed",
];

/**
 * Whether error text contains one of the maintained generation/context-change messages. The page transports these refusals across a process boundary as text; substring recognition supports its existing retry policy but cannot independently prove the error's origin or exclude unrelated causes carrying the same wording. Error property access and string conversion can themselves throw.
 *
 * @evidence contracts/common.md#principled-implementation Known cross-process generation/context-replacement messages classify whether the caller may use its existing generation retry policy.
 * @evidence contracts/common.md#clear-and-simple-design One canonical message list and a substring scan adapt errors whose identity crosses a browser process boundary as text.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The predicate uses the fixed protocol wording without consumer-specific exceptions; matching substrings do not prove source replacement and unprintable thrown values are not caught here.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies process-boundary text recognition and the single maintained list of generation refusals.
 * @evidence contracts/performance.md#efficient-algorithms A fixed seven-message list scans the error text linearly with a constant number of comparisons.
 * @evidence contracts/performance.md#reuse-equivalent-work All consumers share the same refusal wording list, but each supplied error is classified independently without replaying a prior result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The list is fixed module data and each call retains no error, page handle or retry timer.
 */
export const isHumanViewerGenerationChange: (error: unknown) => boolean = (
  error: unknown,
): boolean => {
  const text: string = error instanceof Error ? error.message : String(error);
  return CHANGE_MESSAGES.some((message: string): boolean =>
    text.includes(message),
  );
};
