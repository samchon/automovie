import { preparePortraitOralLining } from "./preparePortraitOralLining";
import { IPortraitOralChamber } from "./structures/IPortraitOralChamber";
import { IAutoMovieMesh } from "@automovie/interface";

/**
 * Preserve the standalone lining mesh API. The same native producer supplies
 * the mouth component with both the geometry and its exact skin correspondence.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Publishes the existing oral enclosure from its single native producer.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Retains depth, chamber, normal and ownership behavior without a second lining implementation.
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
