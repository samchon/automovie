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
 * @evidence contracts/common.md#principled-implementation Drawing, schedule and quantity producers assign unsupported to an unimplemented derivation and not-run to absent or unusable inputs for an implemented one. This describes the producer's chosen path rather than proving fault ownership: numerical bounds or measurement limits can also make otherwise meaningful authored geometry unusable.
 * @evidence contracts/common.md#clear-and-simple-design Two literals are the whole distinction a reader acts on, and finer causes stay in the gap's reason text rather than multiplying statuses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current producers use the same status for shared subjects such as unbounded-space-cell and curved-space-boundary. This is a maintained producer convention, not a type-enforced registry or independent diagnosis of why work was absent.
 * @evidence contracts/common.md#meaningful-documentation States what each literal means with an example and the consistency rule across the three derivations.
 * @author Samchon
 */
export type AutoMovieDrawingGapStatus = "unsupported" | "not-run";
