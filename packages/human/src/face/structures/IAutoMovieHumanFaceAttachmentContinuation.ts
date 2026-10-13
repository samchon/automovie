import type { IAutoMovieHumanFaceAttachmentPoint } from "./IAutoMovieHumanFaceAttachmentPoint";

/**
 * Source-authored support beyond one coarse outer station. Each point lies
 * on existing host incidence; no personal sculpt curve or new mesh is stored.
 * Reference arcs are preparation observations, not fixed runtime distances.
 *
 * @evidence contracts/common.md#principled-implementation A source cage column and ordered actual host-triangle points preserve support beyond a coarse station. Reference ocular arc observations remain preparation data; the runtime rereads the current exterior metric before locating a supported extent.
 * @evidence contracts/common.md#clear-and-simple-design This owner groups one column's support points and reference arc/target data while AttachmentPoint owns the triangle weights.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No personal sculpt path or new mesh is supplied, reference arcs do not freeze runtime distances, and missing or ambiguous supported crossings remain refusals.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish original cage column from resampled indices, actual meridian support, metre reference arcs and unchanged tarsal extent.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record computes no meridian intersection or arc bisection.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Preparation observations define no repeated runtime metric cache or geometry equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns the ordered support arrays; the declaration acquires no temporary intersection mesh or resource.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceAttachmentContinuation {
  /** Original source cage column, not the index in a resampled tissue band. */
  column: number;

  /** Connected actual meridian-plane intersection from the outer station. */
  points: IAutoMovieHumanFaceAttachmentPoint[];

  /** Actual reference ocular meridian arc at each point, in metres. */
  referenceArcsMetres: number[];

  /** Posterior reference arc plus the unchanged registered tarsal extent. */
  referenceTargetMetres: number;
}
