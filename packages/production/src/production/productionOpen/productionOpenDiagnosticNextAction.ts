import { IAutoMovieDiagnostic, IAutoMovieProductionNextAction } from "@automovie/interface";

/**
 * Map one diagnostic to a suggested design, source or compile action.
 *
 * @evidence contracts/common.md#principled-implementation Phase selects the action owner; two generated-ownership codes select removal advice and other compile diagnostics select compile advice, preserving target/reason strings.
 * @evidence contracts/common.md#clear-and-simple-design Inspection projects diagnostics through one classifier rather than maintaining a second action registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Advice executes no deletion or compilation; the nonnull source-path assertion trusts the diagnostic producer's typed source-phase premise.
 * @evidence contracts/common.md#meaningful-documentation Defines owner/action mapping and source path versus diagnostic target selection.
 * @evidence contracts/performance.md#efficient-algorithms One fixed-shape record and bounded phase/code comparisons allocate no project-population copy.
 * @evidence contracts/performance.md#reuse-equivalent-work Already acquired diagnostic text supplies the action without repeating validation or filesystem acquisition.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned action borrows strings and transfers to the report; no resource or task is acquired.
 */
export const productionOpenDiagnosticNextAction: (diagnostic: IAutoMovieDiagnostic) => IAutoMovieProductionNextAction = (diagnostic: IAutoMovieDiagnostic): IAutoMovieProductionNextAction => {
    if (diagnostic.phase === "design")
        return {
            owner: "design",
            action: "correct-design",
            target: diagnostic.target,
            reason: diagnostic.message,
        };
    if (diagnostic.phase === "source")
        return {
            owner: "source",
            action: "correct-source",
            target: diagnostic.path!,
            reason: diagnostic.message,
        };
    return {
        owner: "compile",
        action: diagnostic.code === "generated-unowned" ||
            diagnostic.code === "generated-path-outside"
            ? "remove-unowned-generated"
            : "compile",
        target: diagnostic.target,
        reason: diagnostic.message,
    };
};
