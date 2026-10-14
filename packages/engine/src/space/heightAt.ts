import { IAutoMovieSpace, IAutoMovieSurface } from "@automovie/interface";

import { IAutoMoviePreparedSpace } from "./IAutoMoviePreparedSpace";
import { prepareSpace } from "./prepareSpace";
import { surfaceAt } from "./surfaceAt";
import { surfaceHeightAt } from "./surfaceHeightAt";

/**
 * Read the topmost walkable surface height, or null over absent or no-go tops.
 *
 * @evidence contracts/common.md#principled-implementation The shared topmost query chooses the highest local height with authored-order ties, then walkable membership gates its height; this is a 2.5D top-surface model and cannot walk underneath a no-go overhang.
 * @evidence contracts/common.md#clear-and-simple-design Surface choice and height arithmetic remain in their canonical owners so isWalkable and the ground adapter consume one walking rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A no-go top does not fall through to a lower walkable surface, and missing support remains null; validated finite surface records and a matching prepared generation are prerequisites.
 * @evidence contracts/common.md#meaningful-documentation Documents metre-valued height, null semantics, prepared-space pairing and the absence of overhang clearance inference.
 * @evidence contracts/performance.md#efficient-algorithms Preparing costs O(E) total ring vertices when omitted; a query scans surface edges and W walkable ids, then evaluates the selected height again, with constant additional storage.
 * @evidence contracts/performance.md#reuse-equivalent-work A supplied prepared space avoids rebuilding projections across queries; source mutation requires fresh preparation and no height result is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result is a scalar or null; only a default call's temporary prepared geometry lives until completion, without host resources.
 * @author Samchon
 */
export const heightAt: (
  space: IAutoMovieSpace,
  x: number,
  z: number,
  prepared?: IAutoMoviePreparedSpace,
) => number | null = (
  space: IAutoMovieSpace,
  x: number,
  z: number,
  prepared: IAutoMoviePreparedSpace = prepareSpace(space),
): number | null => {
  const surface: IAutoMovieSurface | null = surfaceAt(space, x, z, prepared);
  if (surface === null) return null;
  if (!space.walkable.includes(surface.id)) return null;
  return surfaceHeightAt(surface, x, z);
};
