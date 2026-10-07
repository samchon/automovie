import type { IAutoMovieMaterial } from "@automovie/interface";

/**
 * A material's base colour as a linear RGB triple, alpha dropped.
 *
 * The material's `baseColor` channels are already linear light in [0, 1], so
 * the triple is copied without conversion. Pigment rules that blend authored
 * finishes into textures read them through this one owner.
 *
 * @evidence contracts/common.md#principled-implementation The material model stores base colour in linear light, so the copy needs no transfer function.
 * @evidence contracts/common.md#clear-and-simple-design One pure read from a material to its RGB triple.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No channel is rescaled or clamped.
 * @evidence contracts/common.md#meaningful-documentation States the colour space, the dropped alpha and the absence of conversion.
 * @evidence contracts/modeling.md#spatial-conventions The triple is dimensionless linear-light RGB in [0, 1].
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function reads a colour and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation Colours it reads are observed under the rules that paint them.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A material colour is an authored finish, not an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is not a caller input.
 * @author Samchon
 */
export function materialBaseColourRgb(
  material: IAutoMovieMaterial,
): [number, number, number] {
  return [material.baseColor.r, material.baseColor.g, material.baseColor.b];
}
