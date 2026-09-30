import { preparePortraitOralLining } from "./preparePortraitOralLining";
import { IPortraitOralChamber } from "./structures/IPortraitOralChamber";
import { IAutoMovieMesh } from "@automovie/interface";

/**
 * Preserve the standalone lining mesh API. The same native producer supplies
 * the mouth component with both the geometry and its exact skin correspondence.
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
