import type { IAutoMovieProductionRenderCleanupObservation } from "./IAutoMovieProductionRenderCleanupObservation";

/**
 * A host-supplied inventory candidate with logical family/path, captured generation and optional observation.
 *
 * @evidence contracts/common.md#principled-implementation The planner validates typed claims and reference relations but does not acquire or prove physical capture; null byte/generation/fingerprint fields withhold exact-generation disposition.
 * @evidence contracts/common.md#clear-and-simple-design This record or union preserves the existing boundary's facts; consuming owners perform admission and effects rather than a new host or registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type shape alone certifies neither native currentness nor successful cleanup; actual consumer predicates and host premises remain required.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish units, nullable claims, operational versus content identity and caller ownership where applicable.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration executes no traversal, parsing or host mutation; its producer/consumer owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape introduces no completed-result cache or cross-attempt identity reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Candidate objects remain with returned normalized decisions; nested observation records are borrowed and no physical handle is acquired by the shape.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderGcCandidate {
    /**
     * Canonical logical ownership path reported by the renderer host.
     */
    path: string;

    /**
     * Ownership class; active locks and attempts are deliberately absent.
     */
    kind: "chunk" | "chunk-pointer" | "chunk-tree" | "dialogue-cache" | "model-cache" | "quarantine" | "publication";

    /**
     * Required digest for chunk, pointer, tree and dialogue/model cache entries;
     * null for quarantine and publication entries.
     */
    digest: string | null;

    /**
     * Recursive resident byte count reported by the host.
     */
    bytes: number | null;

    /**
     * Physical generation captured for this exact target, or null when the host
     * could not authenticate one without weakening the ownership boundary.
     */
    generation: string | null;

    /**
     * Content identity of the captured generation, or null when the host could
     * not capture one. A host that binds one target to private evidence (a
     * quarantine marker and its preserved bytes) reports one digest over both,
     * so a change to either side changes the plan basis before apply.
     */
    fingerprint: string | null;

    /**
     * A host finding that must override ordinary reference-based retention.
     */
    observation: IAutoMovieProductionRenderCleanupObservation | null;
}
