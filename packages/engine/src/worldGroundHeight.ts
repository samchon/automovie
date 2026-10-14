import { IAutoMovieWorldSurface } from "@automovie/interface";

import { worldGroundSurface } from "./worldGroundSurface";
import { worldSurfaceHeight } from "./worldSurfaceHeight";

/**
 * Read the selected world terrain height, retaining null for absent support.
 *
 * @evidence contracts/common.md#principled-implementation worldGroundSurface selects the first containing surface in authored order, then worldSurfaceHeight evaluates that exact record; height does not alter precedence and a no-surface result is distinct from a zero-height plane.
 * @evidence contracts/common.md#clear-and-simple-design Selection and shared height arithmetic remain separate canonical owners consumed by the source oracle and formation relief.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fallback ground or nearest-surface search is invented here; admitted finite/representable surface arithmetic remains a caller premise.
 * @evidence contracts/common.md#meaningful-documentation Documents world XZ metre queries, first-containing precedence and nullable height rather than walkability or continuous support proof.
 * @evidence contracts/performance.md#efficient-algorithms Cost is the visited footprint-edge scan plus constant height-rule evaluation on the first hit, with constant live storage outside delegated edge records.
 * @evidence contracts/performance.md#reuse-equivalent-work The selected record serves both presence and height in one call; mutable lists are rescanned and no terrain-height cache persists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar or null escapes and the borrowed surface list is not retained, with no host handle or active sampler.
 * @author Samchon
 */
export const worldGroundHeight: (
  surfaces: readonly IAutoMovieWorldSurface[],
  point: { x: number; z: number },
) => number | null = (
  surfaces: readonly IAutoMovieWorldSurface[],
  point: { x: number; z: number },
): number | null => {
  const surface: IAutoMovieWorldSurface | null = worldGroundSurface(
    surfaces,
    point,
  );
  return surface === null ? null : worldSurfaceHeight(surface, point);
};
