import { humanFaceRegions } from "./humanFaceRegions";

/**
 * Refuse an unknown anatomical face region, or a side given to a region that
 * has no independent side profile: only eyes, ears and cheeks carry `right` and
 * `left` overrides. Shared by `humanFaceRegionValue` and
 * `replaceHumanFaceRegion`.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation The registered region tuple admits actual profile owners; only eye/ear/cheek support explicit right/left side overrides. Region readers/replacements use the same ownership rule rather than inferring symmetry from geometry.
 * @evidence contracts/common.md#clear-and-simple-design One vocabulary/side predicate separates profile ownership from scalar channels and later document/model admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown regions, sides or unpaired side ownership refuse rather than redirecting to a sibling/global profile; absent side means the shared profile and supplies no anatomical validation.
 * @evidence contracts/common.md#meaningful-documentation Prose states allowed side owners and current callers; successful void means vocabulary ownership only.
 * @evidence contracts/performance.md#efficient-algorithms Region inclusion scans R catalogue entries, then fixed side comparisons; this small supported vocabulary incurs no geometry scan.
 * @evidence contracts/performance.md#reuse-equivalent-work Reader/replacement owners share one closed region tuple and rule, with no cached result for different spellings/sides.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only void/error transfers; no input reference, registry, handle or task is retained.
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
