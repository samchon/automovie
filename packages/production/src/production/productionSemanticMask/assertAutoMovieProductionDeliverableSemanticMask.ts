import { classifyAutoMovieProductionDeliverableSemanticMask } from "./classifyAutoMovieProductionDeliverableSemanticMask";
import type { AutoMovieProductionDeliverableSemanticMaskFinding } from "./AutoMovieProductionDeliverableSemanticMaskFinding";

/**
 * Allow ordinary media or a current complete semantic-mask finding and throw its preserved reason for every other delivered-file status. The shared classifier's typed input and pre-catch error behavior remain applicable.
 *
 * @evidence contracts/common.md#principled-implementation Delegates full classification, then checks its closed discriminant rather than attempting another byte or plan admission policy.
 * @evidence contracts/common.md#clear-and-simple-design The assertion is the terminal publication adapter for the same policy consumed by final diagnostics. The removed proxy preflight provides no current caller or runtime host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No refusal status is downgraded or compensated; ordinary media acceptance does not claim mask evidence for that file.
 * @evidence contracts/common.md#meaningful-documentation Documents accepted statuses, thrown refusal reason and inherited typed-reader premises; it does not return a cloned or sanitized receipt.
 * @evidence contracts/performance.md#efficient-algorithms Adds constant status work to the classifier's complete C/F/L plan scans, selected-layer cloning and canonical receipt byte/schema/hash verification. Moving these checks into the callee does not remove their input-dependent cost or allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work One finding is used for the branch and error reason; the caller's existing probe/bytes are reused by classification and no persistent verdict is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The local finding becomes collectable after return/throw; delegated temporary clones/buffers follow classifier lifetime and no handle, persistent state or task is acquired by this adapter.
 */
export const assertAutoMovieProductionDeliverableSemanticMask: (props: Parameters<typeof classifyAutoMovieProductionDeliverableSemanticMask>[0]) => void = (props: Parameters<typeof classifyAutoMovieProductionDeliverableSemanticMask>[0]): void => {
    const finding: AutoMovieProductionDeliverableSemanticMaskFinding = classifyAutoMovieProductionDeliverableSemanticMask(props);
    if (finding.status !== "media" && finding.status !== "semantic-mask")
        throw new Error(finding.reason);
};
