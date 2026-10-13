/** The refusals a request gets when the page generation it ran on was replaced. */
const CHANGE_MESSAGES = [
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
 * Whether an error only says that the source generation changed while a
 * request ran. The page raises these messages across a process boundary, so
 * they are recognised by their text, kept here as the single list.
 *
 * @evidence contracts/common.md#clear-and-simple-design One list names every generation-change refusal.
 * @evidence contracts/common.md#principled-implementation Recognizes the existing cross-process source-refusal vocabulary and execution-context loss; it classifies the error without establishing fresh source readiness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Matches supported transport diagnostics without changing the failure, replaying a request or authorizing a timer-based viewport replacement.
 * @evidence contracts/common.md#meaningful-documentation States why the refusals are matched by text.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Recognizes the existing cross-process source-refusal vocabulary and execution-context loss; it classifies the error without establishing fresh source readiness.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor One list names every generation-change refusal.
 */
export const isHumanViewerGenerationChange = (error: unknown): boolean => {
  const text = error instanceof Error ? error.message : String(error);
  return CHANGE_MESSAGES.some((message) => text.includes(message));
};
