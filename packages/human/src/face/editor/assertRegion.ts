import { humanFaceRegions } from "./humanFaceRegions";

/**
 * Refuse an unknown anatomical face region, or a side given to a region that
 * has no independent side profile: only eyes, ears and cheeks carry `right` and
 * `left` overrides. Shared by `humanFaceRegionValue` and
 * `replaceHumanFaceRegion`.
 *
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
