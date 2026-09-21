import { IAutoMovieSpace, IAutoMovieSurface } from "@automovie/interface";
import { IAutoMoviePreparedSpace } from "./IAutoMoviePreparedSpace";
import { prepareSpace } from "./prepareSpace";
import { preparedSurfaceContains } from "./preparedSurfaceContains";
import { surfaceHeightAt } from "./surfaceHeightAt";

/**
 * The **topmost** surface under `(x, z)` (walkable or not), or `null` when the
 * point is over nothing. Topmost is decided by the surface height _at that
 * point_ (a ramp may pass over a floor); an exact tie keeps the earlier surface
 * in the array, so the query is deterministic.
 *
 * This is the "what is here" query: an object rests on the topmost surface
 * regardless of walkability. For "may an actor stand here", see {@link heightAt}
 * / {@link isWalkable}.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `surfaceAt` produces the **topmost** surface under `(x, z)` (walkable or not), or `null` when the point is over nothing. This ensures marks and supports resolve against their declared host geometry.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `surfaceAt` performs at surface evaluation when the engine resolves host-relative support geometry and whole-footprint zone membership.
 * @author Samchon
 */
export const surfaceAt = (
  space: IAutoMovieSpace,
  x: number,
  z: number,
  prepared: IAutoMoviePreparedSpace = prepareSpace(space),
): IAutoMovieSurface | null => {
  let best: IAutoMovieSurface | null = null;
  let bestHeight = -Infinity;
  for (const entry of prepared.surfaces) {
    if (!preparedSurfaceContains(entry, x, z)) continue;
    const surface = entry.surface;
    const height = surfaceHeightAt(surface, x, z);
    if (height > bestHeight) {
      best = surface;
      bestHeight = height;
    }
  }
  return best;
};
