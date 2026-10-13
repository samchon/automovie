import type { IAutoMovieDerivedArtifactProblem } from "./IAutoMovieDerivedArtifactProblem";

/**
 * Nullable exact bytes and a nullable problem represent a successful read or one inspection refusal.
 *
 * @evidence contracts/common.md#principled-implementation Nullable exact bytes and a nullable problem represent a successful read or one inspection refusal.
 * @evidence contracts/common.md#clear-and-simple-design The inspection reader supplies this observation to digest checks and fingerprint composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The interface itself permits both/null combinations; the reader maintains the intended bytes-versus-problem relationship rather than the type proving it.
 * @evidence contracts/common.md#meaningful-documentation Documents borrowed read observations and caller-owned byte population.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased observation runs no I/O; derivedArtifactReadInspectionFile owns physical reads and missing/unsafe conversion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape coordinates no cache; inspection reuses one read's bytes for digest and field composition only within the current attempt.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type opens no file; successful byte arrays or refusal records transfer from the synchronous reader to its inspection caller.
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifactProjectFileRead {

    /**
     * Exact caller-owned byte array, or null when the corresponding read produced a refusal.
     */
    bytes: Uint8Array | null;

    /**
     * Read refusal when bytes are unavailable; the producer, rather than this interface, maintains the correlation.
     */
    problem: IAutoMovieDerivedArtifactProblem | null;
}
