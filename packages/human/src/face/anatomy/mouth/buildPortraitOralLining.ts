import { IAutoMovieMesh } from "@automovie/interface";

import { preparePortraitOralLining } from "./preparePortraitOralLining";
import { IPortraitOralChamber } from "./structures/IPortraitOralChamber";

/**
 * Preserve the standalone lining mesh API. The same native producer supplies the mouth component with both the geometry and its exact skin correspondence.
 *
 * @evidence contracts/common.md#principled-implementation The standalone lining entry returns the native producer's mesh for the selected refined boundary.
 * @evidence contracts/common.md#clear-and-simple-design The component consumes that same producer with exact skin correspondence, while this API returns only mesh.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The enclosure alone does not reconstruct gingiva or prove tissue clearance.
 * @evidence contracts/common.md#meaningful-documentation Input portrait coordinates and depth share the preparation frame and caller arrays are unchanged.
 * @evidence contracts/performance.md#efficient-algorithms Work follows boundary tracing and fixed-depth-ring mesh construction in native preparation.
 * @evidence contracts/performance.md#reuse-equivalent-work One preparation owner supplies standalone and connected geometry without duplicate lining logic.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned mesh owns new buffers; unused boundary metadata and temporary preparation state become collectible.
 */
export function buildPortraitOralLining(
  surface: {
    positions: readonly (readonly number[])[];
    indices: readonly number[];
  },
  seed: number,
  depth: number,
  wall: number,
  chamber?: IPortraitOralChamber,
): IAutoMovieMesh {
  return preparePortraitOralLining(surface, seed, depth, wall, chamber).mesh;
}
