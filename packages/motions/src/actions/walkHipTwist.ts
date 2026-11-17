import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import type { IAutoMovieAngleRange } from "@automovie/interface";

/**
 * Read the least internal or external rotation available at either hip.
 *
 * @param rom The range-of-motion table, in degrees.
 * @returns Degrees, the lesser way of the stiffer hip.
 * @throws {Error} When the table gives a hip no twist interval.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the table, unit, chosen limit and refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Takes each hip's smaller internal and external range, then the smaller hip, so the common heading limit holds on either side.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One read per hip and one minimum.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing hip interval is refused rather than assigned a fallback range.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two fixed interval reads, independent of table size.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The caller owns any retained limit; this entry reads the given table.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function walkHipTwist(rom: typeof DEFAULT_HUMANOID_ROM): number {
  return Math.min(
    ...(["leftUpperLeg", "rightUpperLeg"] as const).map(
      (bone: "leftUpperLeg" | "rightUpperLeg"): number => {
        const twist: IAutoMovieAngleRange | null | undefined = rom[bone]?.twist;
        if (twist === null || twist === undefined)
          throw new Error(`The range-of-motion table gives ${bone} no twist`);
        return Math.min(-twist.min, twist.max);
      },
    ),
  );
}
