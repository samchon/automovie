import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";

/**
 * Admit a body basis's named skin points: every name is an own, non-inherited
 * key, and every point is a vertex of a declared surface. A point outside its
 * surface refuses by name.
 *
 * @evidence contracts/common.md#principled-implementation Points are checked once at basis admission, so a rule never reads an index the basis does not hold.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the declared points.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An out-of-range point refuses instead of being clamped or skipped.
 * @evidence contracts/common.md#meaningful-documentation States both conditions and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions Admits indices into the basis's own surfaces.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The conditions are topological, not anatomical.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function assertHumanBodySkinLandmarks(basis: IAutoMovieHumanBodyBasis): void {
  for (const [name, point] of Object.entries(basis.skinLandmarks ?? {})) {
    if (name in Object.prototype)
      throw new Error("A body skin landmark must not be named after an inherited property: " + name);
    const surface = basis.surfaces[point.surface];
    if (
      surface === undefined ||
      !Number.isInteger(point.vertex) ||
      point.vertex < 0 ||
      point.vertex * 3 + 2 >= surface.positions.length
    )
      throw new Error("The body skin landmark " + name + " is not a vertex of a declared surface.");
  }
}
