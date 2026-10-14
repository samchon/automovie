import type { AutoMovieProductionRenderArtifactState } from "./AutoMovieProductionRenderArtifactState";
import type { AutoMovieProductionRenderCleanupAuthority } from "./AutoMovieProductionRenderCleanupAuthority";
import type { AutoMovieProductionRenderArtifactStage } from "./AutoMovieProductionRenderArtifactStage";

/**
 * One host finding carrying state, authority, inspection stage and reason.
 *
 * @evidence contracts/common.md#principled-implementation Candidate admission checks vocabulary and nonblank single-line reason; semantic/physical truth stays with the supplying host.
 * @evidence contracts/common.md#clear-and-simple-design This record or union preserves the existing boundary's facts; consuming owners perform admission and effects rather than a new host or registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type shape alone certifies neither native currentness nor successful cleanup; actual consumer predicates and host premises remain required.
 * @evidence contracts/common.md#meaningful-documentation Member comments distinguish units, nullable claims, operational versus content identity and caller ownership where applicable.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration executes no traversal, parsing or host mutation; its producer/consumer owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape introduces no completed-result cache or cross-attempt identity reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned normalized candidates borrow this nested observation until caller release, without the declaration acquiring a resource.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderCleanupObservation {
    /** Mutually exclusive result of the observation. */
    state: AutoMovieProductionRenderArtifactState;

    /** Host-claimed exact mutation authority; the planner does not acquire proof. */
    authority: AutoMovieProductionRenderCleanupAuthority;

    /** Boundary that produced the observation. */
    stage: AutoMovieProductionRenderArtifactStage;

    /** Sanitized operator-facing explanation. */
    reason: string;
}
