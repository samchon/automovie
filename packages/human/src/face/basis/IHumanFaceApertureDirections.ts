import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Canonical unit directions of the source-defined oral measurement frame.
 * Normalization changes no authored jaw axis or source admission tolerance.
 * These are a model convention, not a registered clinical acquisition frame.
 *
 * @evidence contracts/common.md#principled-implementation One canonical axis and its nearest-basis-Y perpendicular define consistent unit projections for every oral measurement consumer.
 * @evidence contracts/common.md#clear-and-simple-design The three directional quantities share one named result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No camera axis, fallback direction or clinical value replaces the source axis.
 * @evidence contracts/common.md#meaningful-documentation States normalization, handedness and model-versus-clinical meaning.
 * @evidence contracts/modeling.md#spatial-conventions Dimensionless unit directions use the Y-up source head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Defines a measurement frame, not a tissue interface.
 * @evidenceExclude contracts/modeling.md#rendered-observation Measurement consumers own their emitted-position observations.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no biological measurement or acquisition protocol.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source admission owns axis validity; this record asserts no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no authoring input.
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
