import { IAutoMovieMesh } from "@automovie/interface";

import { preparePortraitDentalCrown } from "./preparePortraitDentalCrown";
import { IPortraitDentalCrown } from "./structures/IPortraitDentalCrown";

/**
 * Build the standalone enamel mesh through the same native crown producer used
 * by dental rows. Existing callers retain the mesh-only API and owned buffers.
 */
export function buildPortraitDentalCrown(
  shape: IPortraitDentalCrown,
  mesialDirection: number = 1,
): IAutoMovieMesh {
  return preparePortraitDentalCrown(shape, mesialDirection).mesh;
}
