import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One rooted-stem station's escape request to `aimHumanFaceHairRootedStem`.
 *
 * `normal` is the actual outward normal of the skin at the station and `blocking` the actual outward normal of the surface a trial chord would reach first; both are unit head-frame directions read from the same closed collider. `before` is the previous chord's unit direction and `step` the station's nominal chord in metres, whose construction turn bounds the aim for every trial at that station.
 *
 * @evidence contracts/common.md#principled-implementation Unit previous, skin and blocking directions plus nominal chord length define the station's common-margin escape request.
 * @evidence contracts/common.md#clear-and-simple-design Aim construction and turn limiting are separate owners so clipping cannot redefine the station's nominal turn.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The maximum-margin bisector assumes unit normals; antiparallel normals are refused rather than assigned an arbitrary escape.
 * @evidence contracts/common.md#meaningful-documentation The step is head-frame metres and the directional fields are unitless head-frame vectors.
 * @evidenceExclude contracts/performance.md#efficient-algorithms aimHumanFaceHairRootedStem performs the bisector and bounded rotation; this input type performs neither.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The nominal station step is reused across its trials by the walk, not memoized by this record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns vector inputs and no state, ray index or handle is acquired by this type.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootedAim {
  /** Unit direction of the previous stem chord. */
  before: IAutoMovieVector3;

  /** Unit outward skin normal at the current station. */
  normal: IAutoMovieVector3;

  /** Unit outward normal of the surface a trial chord would reach first. */
  blocking: IAutoMovieVector3;

  /** The station's nominal chord in metres; its construction turn bounds the aim. */
  step: number;
}
