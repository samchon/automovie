/**
 * Whether a derivation is missing entirely or merely had nothing to run on.
 *
 * `unsupported` means the engine has no derivation for the subject, such as
 * sectioning a shell-stated space. `not-run` means the derivation exists but
 * the design gave it no usable input, such as an unbounded cell. Subjects the
 * drawing and the quantity report share carry the same status in both.
 *
 * @author Samchon
 */
export type AutoMovieDrawingGapStatus = "unsupported" | "not-run";
