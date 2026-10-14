import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Canonical unit directions of the source-defined oral measurement frame.
 * Normalization changes no authored jaw axis or source admission tolerance.
 * These are a model convention, not a registered clinical acquisition frame.
 *
 * @evidence contracts/common.md#principled-implementation resolveHumanFaceApertureDirections normalizes the admitted jaw axis and orthogonal cross directions to define one fixed model oral frame; exactly vertical axes refuse.
 * @evidence contracts/common.md#clear-and-simple-design One direction record is shared by incisal/lip aperture readers without changing the authored articulation tuple.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nearest-Y perpendicular is a model convention, not a clinical acquisition frame; no small-angle cutoff supplies a substitute axis.
 * @evidence contracts/common.md#meaningful-documentation Members identify canonical unit axis, perpendicular up and anterior handedness.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased record implements no normalization; its resolver owns scaled vector arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; aperture readers share the resolved frame.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record acquires no resource; consumers own its three vectors.
 *
 * @author Samchon
 */
export interface IHumanFaceApertureDirections {
  /** Unit direction of the source mandibular axis; incisal readers call this left. */
  axis: IAutoMovieVector3;

  /** Unit direction nearest basis Y-up and perpendicular to the canonical axis. */
  up: IAutoMovieVector3;

  /** Unit anterior direction, canonical axis crossed with up. */
  forward: IAutoMovieVector3;
}
