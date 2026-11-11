/**
 * Which step of a headless capture failed, carried by
 * `AutoMovieHeadlessCaptureError.code`.
 *
 * `route` is loading the draw-only page, waiting for its draw function or describing the film. `pass-hook` is an empty or unknown pass list. `capture` is a draw call that failed or did not finish in time.
 *
 * @evidence contracts/development/design.md#principled-representation A closed string union lets a caller branch on the failed capture step with exhaustive narrowing instead of parsing the message text, and each member names one step the session takes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three members cover the three steps the session judges: opening the page, admitting the passes and drawing a frame.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The codes name session steps rather than particular routes, films or tests.
 * @evidence contracts/development/common.md#meaningful-documentation The doc maps every code to the step that raises it.
 */
export type AutoMovieHeadlessCaptureErrorCode = "route" | "pass-hook" | "capture";
