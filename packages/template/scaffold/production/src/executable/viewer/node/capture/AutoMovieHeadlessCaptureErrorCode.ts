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
 * @evidence contracts/development/design.md#principled-representation A closed string union lets a caller branch on the failed capture step with exhaustive narrowing instead of parsing the message text, and each member names one call the adapter makes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Five members cover the five page calls or results the adapter judges; style injection and screenshot share `capture` because both mean the page could not be captured, not that a viewer hook is missing.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The codes name adapter steps rather than particular routes, viewers or tests, and no code is reserved for a single caller.
 * @evidence contracts/development/common.md#meaningful-documentation The doc maps every code to the page call or result that raises it, including the creation and per-frame cases of the two hook codes.
 */
export type AutoMovieHeadlessCaptureErrorCode =
  | "route"
  | "seek-hook"
  | "pass-hook"
  | "capture"
  | "empty-frame";
