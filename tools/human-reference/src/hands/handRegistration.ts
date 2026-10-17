import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import type { RegionFile } from "../schema/RegionFile.ts";

/**
 * Admits inherited observations only when frame and source byte identities match.
 *
 * @evidence contracts/common.md#principled-implementation Matches units, gate, frame and both fixed source hashes before mixing inherited contours with fresh source cuts.
 * @evidence contracts/common.md#clear-and-simple-design One admission rule is shared by hand observations and their consumed limb boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal filenames or rig labels cannot substitute for matching source bytes.
 * @evidence contracts/common.md#meaningful-documentation Defines which registration facts are admitted and that a mismatch fails.
 * @evidence contracts/performance.md#efficient-algorithms Two source-hash membership scans take O(n) time for n provenance entries and constant working space.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses parsed provenance records already read from verified manifest bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no handles and retains no observation or cache after return.
 */
export function handRegistration(
  region: RegionFile,
  manifest: ReferenceManifest,
  expectedRegion: string,
): void {
  if (
    region.region !== expectedRegion ||
    region.gate !== manifest.gate ||
    region.units !== "mm" ||
    region.frame !== manifest.frame
  )
    throw new Error(`Hand input registration differs: ${expectedRegion}`);
  for (const input of ["body", "head"]) {
    const hash: string | undefined = manifest.files[input]?.sha256;
    if (
      !hash ||
      !region.sources.some(
        (value: RegionFile["sources"][number]): boolean =>
          value.sha256.toLowerCase() === hash.toLowerCase() &&
          value.pose === "native-A",
      )
    )
      throw new Error(
        `Inherited ${expectedRegion} does not identify the declared native-A ${input} bytes`,
      );
  }
}
