/**
 * The person editor's status derives from session state and accepted history. Pending work takes precedence; otherwise refusal, construction draft, accepted person or empty display determine the state, and retained notes append to the text. An error can coexist with a preserved draft or accepted model on screen.
 *
 * @evidence contracts/common.md#principled-implementation Status derives from the current session and separate accepted-person history, preserving pending/refusal precedence and explicit draft display.
 * @evidence contracts/common.md#clear-and-simple-design One text/state result separates state interpretation from actual DOM painting and numerical admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Construction drafts are not labelled ready and a refusal describes what stayed displayed rather than an invented changed person.
 * @evidence contracts/common.md#meaningful-documentation The comment explains precedence, appended notes and error presentation alongside preserved display.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The status schema selects no line formatting, failure traversal or DOM update algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Display status is an authored state observation rather than a cached numerical result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Text and state data acquire no listener, model handle or pending computation.
 *
 * @author Samchon
 */
export interface IConnectedPersonStatus {
  /** The lines to display. */
  text: string;

  /** building: an intent is pending. ready: the accepted person is shown. draft: a refused construction is shown. error: the newest intent was refused. empty: nothing has been built. */
  state: "building" | "ready" | "draft" | "error" | "empty";
}
