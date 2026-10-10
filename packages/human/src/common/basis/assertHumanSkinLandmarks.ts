import type { IAutoMovieHumanSkinLandmarkHolder } from "./IAutoMovieHumanSkinLandmarkHolder";

/**
 * Admit a basis's named skin points: every name is an own, non-inherited key,
 * and every point is a vertex of a declared surface. A point outside its
 * surface refuses by name. Face and body bases admit theirs through this one
 * owner.
 */
export function assertHumanSkinLandmarks(
  basis: IAutoMovieHumanSkinLandmarkHolder,
): void {
  for (const [name, point] of Object.entries(basis.skinLandmarks ?? {})) {
    if (name in Object.prototype)
      throw new Error(
        `The basis ${basis.id} names a skin landmark after an inherited property: ${name}`,
      );
    const surface = basis.surfaces[point.surface];
    if (
      surface === undefined ||
      !Number.isInteger(point.vertex) ||
      point.vertex < 0 ||
      point.vertex * 3 + 2 >= surface.positions.length
    )
      throw new Error(
        `The skin landmark ${name} of ${basis.id} is not a vertex of a declared surface.`,
      );
  }
}
