
import { preparePortraitDentalCrown } from "./preparePortraitDentalCrown";
import { IPortraitDentalCrown } from "./structures/IPortraitDentalCrown";
import { IAutoMovieMesh } from "@automovie/interface";
/**
 * Build the standalone enamel mesh through the same native crown producer used
 * by dental rows. Existing callers retain the mesh-only API and owned buffers.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Publishes one independently shaped enamel crown without a second loft formula.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Retains the native crown producer's oriented mesh, normals and millimetre coordinates.
 */
export function buildPortraitDentalCrown(
  shape: IPortraitDentalCrown,
  mesialDirection: number = 1,
): IAutoMovieMesh {
  return preparePortraitDentalCrown(shape, mesialDirection).mesh;
}