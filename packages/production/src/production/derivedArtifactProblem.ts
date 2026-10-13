import type { AutoMovieDerivedArtifactProblemCode } from "./AutoMovieDerivedArtifactProblemCode";
import type { IAutoMovieDerivedArtifactProblem } from "./IAutoMovieDerivedArtifactProblem";

/**
 * A typed category, target, nullable path and message form one inspection refusal record without altering their meanings.
 *
 * @evidence contracts/common.md#principled-implementation A typed category, target, nullable path and message form one inspection refusal record without altering their meanings.
 * @evidence contracts/common.md#clear-and-simple-design Inspection accumulates these records while fingerprint fields independently preserve the byte observations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No category or target triggers automatic repair, ignored failure or fabricated artifact content.
 * @evidence contracts/common.md#meaningful-documentation States path nullability and caller-owned diagnostic explanation.
 * @evidence contracts/performance.md#efficient-algorithms Copies four references/scalars in constant work without traversing message or artifact bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work One current refusal is constructed per observation; equal text does not establish interchangeable filesystem observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains the small record as long as its problem list; no file bytes, handle or task are acquired.
 */
export const derivedArtifactProblem: (code: AutoMovieDerivedArtifactProblemCode, target: string, pathValue: string | null, message: string) => IAutoMovieDerivedArtifactProblem = (code: AutoMovieDerivedArtifactProblemCode, target: string, pathValue: string | null, message: string): IAutoMovieDerivedArtifactProblem => ({
    code,
    target,
    path: pathValue,
    message,
});
