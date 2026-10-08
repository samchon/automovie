import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One static mesh's publication frame, separate from its source metre frame.
 * The source remains owned by its geometry producer. Subtracting origin gives
 * the local mesh; the ordinary part translation restores its placement.
 *
 * @evidence contracts/common.md#principled-implementation Retains the actual source, local geometry and compensating origin together.
 * @evidence contracts/common.md#clear-and-simple-design One record carries one representation conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no vertex alias, topology change or authoring input.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes source coordinates from publication coordinates.
 * @evidence contracts/modeling.md#spatial-conventions Both frames use metres and differ only by translation.
 * @evidence contracts/modeling.md#shared-boundaries Keeps the supplied source incidence unchanged.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The existing model part owns identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no personal channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The conversion owner retains the supplied geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The normal viewport owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical coordinates supply no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Changes no physical admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Introduces no shaping control.
 */
export interface IHumanLocalMeshFrame {
  /** Original geometry in the producer's metre frame. */
  source: IAutoMovieMesh;
  /** Source-frame position of the publication frame's origin. */
  origin: IAutoMovieVector3;
  /** Same vertices and incidence, translated into the publication frame. */
  mesh: IAutoMovieMesh;
}
