import type { IAutoMovieHumanSkinLandmarkHolder } from "./IAutoMovieHumanSkinLandmarkHolder";

/**
 * Admit a basis's named skin points: every name is an own, non-inherited key,
 * and every point is a vertex of a declared surface. A point outside its
 * surface refuses by name. Face and body bases admit theirs through this one
 * owner.
 *
 * @evidence contracts/common.md#principled-implementation Checks own named points against declared surfaces and integer vertex ordinals within flat XYZ arrays, refusing by point and basis identity.
 * @evidence contracts/common.md#clear-and-simple-design Face and body basis admission call one shared landmark guard instead of maintaining separate index rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inherited Object.prototype names cannot become points, and missing points are not mapped to another basis.
 * @evidence contracts/common.md#meaningful-documentation Documents named-point ownership, surface membership and point/basis refusal labels.
 * @evidence contracts/performance.md#efficient-algorithms For L points, one Object.entries pass costs O(L) checks and entry storage; only position lengths are read, without copying vertex buffers.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads the current point table at admission; no cached result survives replacement of names or surfaces.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only temporary entries and failure diagnostics are allocated; no point or surface buffer is retained.
 */
export function assertHumanSkinLandmarks(
  basis: IAutoMovieHumanSkinLandmarkHolder,
): void {
  for (const [name, point] of Object.entries(basis.skinLandmarks ?? {})) {
    if (name in Object.prototype)
      throw new Error(
        `The basis ${basis.id} names a skin landmark after an inherited property: ${name}`,
      );
    const surface:
      | IAutoMovieHumanSkinLandmarkHolder["surfaces"][number]
      | undefined = basis.surfaces[point.surface];
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
