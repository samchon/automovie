import { IAutoMovieSpace, IAutoMovieSurface } from "@automovie/interface";

import { IAutoMoviePreparedSpace } from "./IAutoMoviePreparedSpace";
import { prepareSpace } from "./prepareSpace";
import { preparedSurfaceContains } from "./preparedSurfaceContains";
import { surfaceHeightAt } from "./surfaceHeightAt";

/**
 * Select the topmost surface at an XZ query, including non-walkable surfaces.
 *
 * @evidence contracts/common.md#principled-implementation Prepared ring membership and canonical local height are scanned in authored order; strictly greater heights replace the winner, so exact ties retain the first surface.
 * @evidence contracts/common.md#clear-and-simple-design This selector owns topmost ordering while membership and height rules remain separate canonical owners; heightAt adds walkability afterward.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No covering surface returns null and no underneath-overhang search is invented; finite admitted heights and a matching preparation are prerequisites, while NaN heights cannot win the comparison.
 * @evidence contracts/common.md#meaningful-documentation Documents borrowed winner identity, tie order, null semantics and the distinction between presence and walkability.
 * @evidence contracts/performance.md#efficient-algorithms A query scans E edges across S surfaces with O(1) height arithmetic per candidate; default preparation adds O(E) owned storage and work.
 * @evidence contracts/performance.md#reuse-equivalent-work A supplied prepared space shares ring projections between queries; the space parameter is not checked against that generation and callers must keep them paired.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The winner is a borrowed source surface; call-local selection state and default preparation acquire no external resources.
 * @author Samchon
 */
export const surfaceAt: (
  space: IAutoMovieSpace,
  x: number,
  z: number,
  prepared?: IAutoMoviePreparedSpace,
) => IAutoMovieSurface | null = (
  space: IAutoMovieSpace,
  x: number,
  z: number,
  prepared: IAutoMoviePreparedSpace = prepareSpace(space),
): IAutoMovieSurface | null => {
  let best: IAutoMovieSurface | null = null;
  let bestHeight: number = -Infinity;
  for (const entry of prepared.surfaces) {
    if (!preparedSurfaceContains(entry, x, z)) continue;
    const surface: IAutoMovieSurface = entry.surface;
    const height: number = surfaceHeightAt(surface, x, z);
    if (height > bestHeight) {
      best = surface;
      bestHeight = height;
    }
  }
  return best;
};
