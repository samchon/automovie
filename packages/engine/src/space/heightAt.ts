import { IAutoMovieSpace } from "@automovie/interface";
import { IAutoMoviePreparedSpace } from "./IAutoMoviePreparedSpace";
import { prepareSpace } from "./prepareSpace";
import { surfaceAt } from "./surfaceAt";
import { surfaceHeightAt } from "./surfaceHeightAt";

/**
 * The walking height at `(x, z)`: the height of the topmost surface there,
 * **when that surface is walkable**: `null` over nothing and `null` when the
 * topmost surface is a no-go top (standing space is occupied by something an
 * actor may not stand on; this 2.5-D heightfield cannot walk _under_ it:
 * overhang clearance belongs to the structured building volume layer).
 *
 * `isWalkable` is exactly `heightAt !== null`, so the two queries can never
 * disagree.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `heightAt` produces the walking height at `(x, z)`: the height of the topmost surface there, **when that surface is walkable**: `null` over nothing and `null` when the topmost surface is a no-go top (standing space is occupied by something an actor may not stand on; this 2.5-D heightfield cannot walk _under_ it: overhang clearance belongs to the structured building volume layer). This ensures marks and supports resolve against their declared host geometry.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `heightAt` returns the topmost walkable height at a plan point and refuses empty or no-go tops with `null`.
 * @author Samchon
 */
export const heightAt = (
  space: IAutoMovieSpace,
  x: number,
  z: number,
  prepared: IAutoMoviePreparedSpace = prepareSpace(space),
): number | null => {
  const surface = surfaceAt(space, x, z, prepared);
  if (surface === null) return null;
  if (!space.walkable.includes(surface.id)) return null;
  return surfaceHeightAt(surface, x, z);
};
