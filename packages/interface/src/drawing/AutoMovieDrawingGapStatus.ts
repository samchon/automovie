/**
 * Whether a derivation is missing entirely or merely had nothing to run on.
 *
 * `unsupported` means the engine has no derivation for the subject, such as
 * sectioning a shell-stated space. `not-run` means the derivation exists but
 * the design gave it no usable input, such as an unbounded cell. Subjects the
 * drawing and the quantity report share carry the same status in both.
 *
 * @evidence contracts/common.md#principled-implementation Two literals split the cause between missing engine capability and missing design input, so a reader knows whether to change the design or wait for a derivation.
 * @evidence contracts/common.md#clear-and-simple-design A drawing-module alias with the same two literals as `AutoMovieRenderAnalysisStatus`, kept local so drawing records need not import from the render module.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each derivation picks the literal per subject from what is actually absent, and shared subjects such as `unbounded-space-cell` get the same literal in the drawing and the quantity report.
 * @evidence contracts/common.md#meaningful-documentation Defines each literal with an example subject and states the cross-artifact consistency rule.
 * @author Samchon
 */
export type AutoMovieDrawingGapStatus = "unsupported" | "not-run";
