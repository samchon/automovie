/**
 * Which step of a headless capture failed, carried by
 * `AutoMovieHeadlessCaptureError.code`.
 *
 * `route` is the navigation to the viewer URL. `seek-hook` is the seek global
 * being absent at creation or throwing during a frame. `pass-hook` is an empty
 * or unknown pass list, the pass global being absent when a non-beauty pass is
 * requested, or that global throwing during a frame. `capture` is the UI-hiding
 * style injection or the screenshot call. `empty-frame` is a screenshot that
 * returned zero bytes.
 *
 * @evidence contracts/common.md#principled-implementation A closed string union lets a caller branch on the failed capture step with exhaustive narrowing instead of parsing the message text, and each member names one call the adapter makes.
 * @evidence contracts/common.md#clear-and-simple-design Five members cover the five page calls or results the adapter judges; style injection and screenshot share `capture` because both mean the page could not be captured, not that a viewer hook is missing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The codes name adapter steps rather than particular routes, viewers or tests, and no code is reserved for a single caller.
 * @evidence contracts/common.md#meaningful-documentation The doc maps every code to the page call or result that raises it, including the creation and per-frame cases of the two hook codes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A string literal union is erased at compile time and runs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The union names failure categories and coordinates no work that could be shared between captures.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A code is one immutable string on the error instance and owns no handle, buffer or task.
 */
export type AutoMovieHeadlessCaptureErrorCode =
  | "route"
  | "seek-hook"
  | "pass-hook"
  | "capture"
  | "empty-frame";
