import { humanFaceRegions } from "./humanFaceRegions";

/**
 * Shared by humanFaceRegionValue, replaceHumanFaceRegion, which were one file until each public identity took its own.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Names the numerical editor's replaceable anatomical regions.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Keeps region selection on actual profile owners.
 * @author Samchon
 */
export function assertRegion(region: string, side?: string): void {
  if (!(humanFaceRegions as readonly string[]).includes(region))
    throw new Error("Unknown anatomical face region.");
  if (
    side !== undefined &&
    ((side !== "right" && side !== "left") ||
      (region !== "eye" && region !== "ear" && region !== "cheek"))
  )
    throw new Error(
      "Only eyes, cheeks and pinnae have independent side-profile overrides.",
    );
}
