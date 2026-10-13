/**
 * Whether a derivation is missing entirely or merely had nothing to run on.
 *
 * `unsupported` means the engine has no derivation for the subject, such as
 * sectioning a shell-stated space. `not-run` means the derivation exists but
 * the design gave it no usable input, such as an unbounded cell. A subject the
 * drawing, schedule and quantity report share, such as
 * `unbounded-space-cell` or `curved-space-boundary`, carries the same status in
 * each.
 *
 * @evidence contracts/common.md#principled-implementation The status separates a fault of the engine from a fault of the design, so the remedy can point at the right owner: `deriveAutoMovieDrawing`, `deriveAutoMovieDrawingSchedule` and `measureAutoMovieQuantities` assign it per subject from which of the two is absent.
 * @evidence contracts/common.md#clear-and-simple-design Two literals are the whole distinction a reader acts on, and finer causes stay in the gap's reason text rather than multiplying statuses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A shared subject is given one status in every derivation that reports it, so a sheet and a take-off never disagree about whose fault an absence is.
 * @evidence contracts/common.md#meaningful-documentation States what each literal means with an example and the consistency rule across the three derivations.
 * @author Samchon
 */
export type AutoMovieDrawingGapStatus = "unsupported" | "not-run";
