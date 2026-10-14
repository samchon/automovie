import { IAutoMovieDiagnostic, IAutoMovieProductionNextAction } from "@automovie/interface";

/**
 * Map one diagnostic to a suggested design, source or compile action.
 *
 * @evidence contracts/common.md#principled-implementation Phase selects the action owner; two generated-ownership codes select removal advice and other compile diagnostics select compile advice. Source actions forward the supplied path, while other actions forward the diagnostic target; every action reuses the original message.
 * @evidence contracts/common.md#clear-and-simple-design Inspection projects diagnostics through one classifier rather than maintaining a second action registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Advice executes no deletion or compilation. The source-path nonnull assertion supplies no runtime check, and actual inventory-failure producers supply null paths; those source actions therefore leak null targets despite the declared string result contract, an unresolved projection gap.
 * @evidence contracts/common.md#meaningful-documentation Defines owner/action mapping, source path versus diagnostic target selection and the actual nullable-source-path gap; returned advice does not authorize or perform a repair.
 * @evidence contracts/performance.md#efficient-algorithms One fixed-shape record and bounded phase/code comparisons allocate no project-population copy.
 * @evidence contracts/performance.md#reuse-equivalent-work Already acquired diagnostic text supplies the action without repeating validation or filesystem acquisition.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned action borrows diagnostic field values and transfers to the report; no resource or task is acquired.
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
