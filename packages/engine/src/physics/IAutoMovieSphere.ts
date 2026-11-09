import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A world-space sphere supplied as an approximate collider for a segment hit.
 *
 * @evidence contracts/development/design.md#principled-representation A center in world metres and positive radius define the rotation-invariant sphere used by segmentSphere; that predicate admits finite components and a finite positive radius.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The collider carries only geometry needed by the analytic segment intersection, without a rig or mesh adapter.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The sphere is an explicit caller approximation of a body; this type does not claim to enclose an arbitrary rider or mesh.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify world-space center and metre radius; callers own the vectors and admission occurs at the intersection seam.
 */
export interface IAutoMovieSphere {
  /** Borrowed world-space center in metres; intersection admits finite values. */
  center: IAutoMovieVector3;

  /** Positive radius in world meters. */
  radius: number;
}
