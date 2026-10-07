import type { IAutoMovieHumanFaceAttachmentPoint } from "./IAutoMovieHumanFaceAttachmentPoint";

/**
 * Source-authored support beyond one coarse outer station. Each point lies
 * on existing host incidence; no personal sculpt curve or new mesh is stored.
 * Reference arcs are preparation observations, not fixed runtime distances.
 *
 * @evidence contracts/common.md#principled-implementation Exact source triangle seats distinguish material identity from reference-frame arc observations.
 * @evidence contracts/common.md#clear-and-simple-design One column associates a connected support path with its preparation readings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No added mesh, changed extent or surrogate optical surface supplies coverage.
 * @evidence contracts/common.md#meaningful-documentation Separates source column identity, actual attachment seats and reference-only distances.
 * @evidence contracts/modeling.md#spatial-conventions Reference ocular meridian arcs use metres; runtime rereads the current exterior metric.
 * @evidence contracts/modeling.md#shared-boundaries Every path point reads the actual host triangle with its original corner weights.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Registers material support rather than another anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels No personal control is added by source continuation.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The support path adds no rendered primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue builder observes the attached surface.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Arc readings describe a reference geometry, not a clinical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing extent and exterior owners retain their bounds.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Personal documents contain numerical dimensions rather than these source paths.
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
