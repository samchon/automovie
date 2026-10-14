import { autoMovieSemanticMaskVerificationFailure } from "@automovie/engine";
import { AutoMovieCaptureObservation } from "@automovie/interface";
import { IAutoMovieProductionSemanticMaskEvidence } from "./IAutoMovieProductionSemanticMaskEvidence";
import { AutoMovieProductionSemanticMaskStatus } from "./AutoMovieProductionSemanticMaskStatus";
import { verifyAutoMovieProductionSemanticMaskEvidence } from "./verifyAutoMovieProductionSemanticMaskEvidence";
import { productionSemanticMaskNonBlank } from "./productionSemanticMaskNonBlank";

/**
 * Classify a typed optional capture observation while retaining its original evidence or reason. Envelope discriminants and version/shot are read before the verifier catch, so structurally malformed untyped host values can still throw; this is not an arbitrary-value schema ingress.
 *
 * @evidence contracts/common.md#principled-implementation Not-run reasons must be non-blank, version/shot distinguish unsupported/foreign, verifier failures map to unsupported or invalid, and admitted nonzero runtime gaps select incomplete rather than complete.
 * @evidence contracts/common.md#clear-and-simple-design The explicit status ladder keeps absence, protocol mismatch and runtime coverage separate for oracle preview diagnostics; full admission stays in the shared verifier.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reasons are not word-count or quality graded, and incomplete evidence is retained rather than rewritten to complete. Unsupported engine versions keep their distinct cause.
 * @evidence contracts/common.md#meaningful-documentation Documents typed observation premise, pre-catch field access, retained references, all status meanings and incomplete preview's refusal at final delivery.
 * @evidence contracts/performance.md#efficient-algorithms Status selection adds fixed comparisons and string trimming/diagnostic formatting; observed evidence also pays complete envelope/palette/coverage verification with own-key sorting, canonical hashing and unresolved-id scans. Not-run work scales with reason characters, and valid payload populations remain uncapped here.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted evidence object is returned by reference so no second palette is rebuilt for classification; no verdict is cached across host observations or mutable record changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only an invocation-local status record/reason is created, with returned evidence owned by the host/caller. No file handle, queue or task is opened, and classifier lifetime does not own the palette buffer graph.
 */
export const classifyAutoMovieProductionSemanticMaskEvidence: (props: {

    /** Typed optional host observation; not-run carries its original reason. */
    observation: AutoMovieCaptureObservation<IAutoMovieProductionSemanticMaskEvidence>;

    /** Exact shot identifier this boundary admits. */
    expectedShot: string;
}) => AutoMovieProductionSemanticMaskStatus = (props: {

    /** Typed optional host observation; not-run carries its original reason. */
    observation: AutoMovieCaptureObservation<IAutoMovieProductionSemanticMaskEvidence>;

    /** Exact shot identifier this boundary admits. */
    expectedShot: string;
}): AutoMovieProductionSemanticMaskStatus => {
    if (props.observation.status === "not-run")
        return productionSemanticMaskNonBlank(props.observation.reason)
            ? { status: "not-run", reason: props.observation.reason }
            : {
                status: "invalid",
                reason: "semantic evidence not-run reason must be non-blank",
            };
    const evidence: IAutoMovieProductionSemanticMaskEvidence = props.observation.value;
    if (evidence.version !== 1)
        return {
            status: "unsupported",
            reason: `unsupported semantic evidence version ${String(evidence.version)}; expected 1`,
        };
    if (productionSemanticMaskNonBlank(evidence.shot) && evidence.shot !== props.expectedShot)
        return {
            status: "foreign",
            reason: `foreign semantic evidence for shot "${evidence.shot}"; expected "${props.expectedShot}"`,
        };
    try {
        verifyAutoMovieProductionSemanticMaskEvidence({
            evidence,
            expectedShot: props.expectedShot,
        });
    }
    catch (error) {
        return {
            status: autoMovieSemanticMaskVerificationFailure(error) === "unsupported"
                ? "unsupported"
                : "invalid",
            reason: (error as Error).message,
        };
    }
    if (evidence.coverage.unresolved.length !== 0 ||
        evidence.coverage.unaddressed !== 0)
        return {
            status: "incomplete",
            evidence,
            reason: `semantic mask for shot "${evidence.shot}" has ${evidence.coverage.unresolved.length} unresolved ids and ${evidence.coverage.unaddressed} unaddressed meshes`,
        };
    return { status: "complete", evidence };
};
