import type { IAutoMovieHumanBodyLayerThicknessField } from "./IAutoMovieHumanBodyLayerThicknessField";

/**
 * One evaluated body skin and the thickness field that layers it.
 *
 * Positions are the skin's native vertices as the body builder evaluated
 * them, shaped or not, so the same field layers any state of the same skin.
 *
 * @evidence contracts/common.md#principled-implementation The builder receives the evaluated skin itself, so the layer is derived from the surface that is drawn.
 * @evidence contracts/common.md#clear-and-simple-design Positions, triangles and one field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No neutral copy of the skin is substituted for the evaluated one.
 * @evidence contracts/common.md#meaningful-documentation States which state of the skin the positions are.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the body's canonical frame; indices address the native vertex ordinals the field uses.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The input defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The input carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The input emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The builder constructs the boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The input owns nothing a viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The field owns the values and their sources.
 * @evidenceExclude contracts/anatomy.md#permitted-range The builder owns limited offset observations, not a clinical thickness range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The input is no authoring control.
 * @author Samchon
 */
export interface IHumanBodyLayerSurfacesInput {
  /** Evaluated native skin positions, three metre-valued coordinates per vertex. */
  positions: readonly number[];

  /** The skin's triangles over those vertices. */
  indices: readonly number[];

  /** Thickness field addressed by the same vertex ordinals. */
  field: IAutoMovieHumanBodyLayerThicknessField;
}
