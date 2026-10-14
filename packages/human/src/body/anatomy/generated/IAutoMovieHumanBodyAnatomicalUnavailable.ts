import type { AutoMovieHumanBodyAnatomicalUnavailableReason } from "./AutoMovieHumanBodyAnatomicalUnavailableReason";

/**
 * A named anatomical component that was not generated, with its cause.
 *
 * @evidence contracts/common.md#principled-implementation Part identity/unavailable discrimination carry one closed cause when no validated individual component exists.
 * @evidence contracts/common.md#clear-and-simple-design Identity/status/reason replace fake geometry fields for missing parts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailability preserves its cause without source placeholders or successful-render certificates.
 * @evidence contracts/common.md#meaningful-documentation Members explain exact part ownership, absent validated generation and distinct failure causes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Unavailable records contain no geometry-producing or classification algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Missing-part reports own no completed generation or retry cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Failure records retain no substitute surface, solver state or source resource.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAnatomicalUnavailable<Id extends string> {
  /** Names the exact part that could not be resolved. */
  readonly id: Id;

  /** No validated individual component was generated. */
  readonly status: "unavailable";

  /** Distinguishes missing input, missing anatomy and domain failure. */
  readonly reason: AutoMovieHumanBodyAnatomicalUnavailableReason;
}
