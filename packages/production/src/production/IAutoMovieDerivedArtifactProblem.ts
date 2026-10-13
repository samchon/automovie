import type { AutoMovieDerivedArtifactProblemCode } from "./AutoMovieDerivedArtifactProblemCode";

/**
 * A category, target, nullable affected path and explanation carry one derivation refusal.
 *
 * @evidence contracts/common.md#principled-implementation A category, target, nullable affected path and explanation carry one derivation refusal.
 * @evidence contracts/common.md#clear-and-simple-design Inspection accumulates these records while byte-state fingerprint fields remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type validates no filesystem state and null path does not fabricate a valid file.
 * @evidence contracts/common.md#meaningful-documentation Documents refusal address and caller-owned message without byte retention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased refusal record selects no traversal; derivedArtifactProblem copies four supplied references/scalars and inspection owns validation work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A problem record shares no completed operation; the inspection emits a current observation rather than caching equal message text.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type retains nothing; the inspection caller owns diagnostic strings without file bytes or descriptors in this record.
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifactProblem {

    /**
     * Stable refusal category selected by the owning admission boundary.
     */
    code: AutoMovieDerivedArtifactProblemCode;

    /**
     * Logical artifact or manifest address named by this refusal.
     */
    target: string;

    /** Supplied path named by this observation; unsafe candidate spellings remain visible rather than normalized. Null means no individual pathname owns the observation. */
    path: string | null;

    /**
     * Caller-owned explanation naming the observed refusal and correction context.
     */
    message: string;
}
