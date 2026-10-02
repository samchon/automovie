import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";

/**
 * Append the seam's frozen edge samples to a source position array.
 * Neutral compilation and already posed body endpoints use this same stencil.
 * Interpolating after the body's nonlinear skinning preserves the source
 * triangle's performed surface; skinning an interpolated weight/rest point
 * would produce a different point. Arrays are owned, metres remain in the
 * caller's frame, and original source numbers never change.
 *
 * @evidence contracts/common.md#principled-implementation Affine interpolation evaluates each new point on its source edge after the caller's deformation; it does not commute nonlinear posing through interpolation.
 * @evidence contracts/common.md#clear-and-simple-design One gather appends samples without renumbering original endpoints.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The frozen cut supplies every fraction; no posed fit or subject constant enters.
 * @evidence contracts/common.md#meaningful-documentation Explains endpoint posing order, ownership and source identity.
 * @evidence contracts/modeling.md#spatial-conventions Position units and frames are unchanged.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no authored channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Evaluates existing topology samples only.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The seam's cut owns boundary identity.
 * @evidenceExclude contracts/modeling.md#rendered-observation Owns no displayed form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Defines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits no anatomical input.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no user input.
 */
export function evaluateHumanPersonCut(
  positions: readonly number[],
  cut: NonNullable<IAutoMovieHumanPersonSeam["cut"]>,
): number[] {
  return [...positions, ...cut.intersections.flatMap(({ a, b, t }) =>
    [0, 1, 2].map((axis) =>
      (1 - t) * positions[a * 3 + axis] + t * positions[b * 3 + axis],
    ),
  )];
}
