/**
 * Whether a derivation is missing entirely or merely had nothing to run on.
 *
 * `unsupported` means the engine has no derivation for the subject, such as
 * sectioning a shell-stated space. `not-run` means the derivation exists but
 * the design gave it no usable input, such as an unbounded cell. A subject the
 * drawing, schedule and quantity report share, such as `unbounded-space-cell`
 * or `curved-space-boundary`, carries the same status in each.
 */
export type AutoMovieDrawingGapStatus = "unsupported" | "not-run";
