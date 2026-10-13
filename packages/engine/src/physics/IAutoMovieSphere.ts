import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A world-space sphere supplied as an approximate collider for a segment hit.
 *
 * @evidence contracts/common.md#principled-implementation A center in world metres and positive radius define the rotation-invariant sphere used by segmentSphere; that predicate admits finite components and a finite positive radius.
 * @evidence contracts/common.md#clear-and-simple-design The collider carries only geometry needed by the analytic segment intersection, without a rig or mesh adapter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The sphere is an explicit caller approximation of a body; this type does not claim to enclose an arbitrary rider or mesh.
 * @evidence contracts/common.md#meaningful-documentation Members identify world-space center and metre radius; callers own the vectors and admission occurs at the intersection seam.
 * @evidence contracts/performance.md#efficient-algorithms One vector and one scalar are fixed-size; the intersection uses constant arithmetic independent of model complexity.
 * @evidence contracts/performance.md#reuse-equivalent-work The same borrowed collider can be tested against successive trajectory chords while the caller keeps its values unchanged; no identity cache is implied.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains the collider as needed; the type opens no resource and stores no intersection history.
 *
 * @author Samchon
 */
export interface IAutoMovieSphere {
  /** Borrowed world-space center in metres; intersection admits finite values. */
  center: IAutoMovieVector3;

  /** Positive radius in world meters. */
  radius: number;
}
