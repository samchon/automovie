import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import type { IAutoMovieAngleRange } from "@automovie/interface";

/** The alternatives of `WalkHipTwistBone`'s site. */
type WalkHipTwistBone = "leftUpperLeg" | "rightUpperLeg";

/**
 * Read the least internal or external rotation available at either hip.
 *
 * @param rom The range-of-motion table, in degrees.
 * @returns Degrees, the lesser way of the stiffer hip.
 * @throws {Error} When the table gives a hip no twist interval.
 */
export function walkHipTwist(rom: typeof DEFAULT_HUMANOID_ROM): number {
  return Math.min(
    ...(["leftUpperLeg", "rightUpperLeg"] as const).map(
      (bone: WalkHipTwistBone): number => {
        const twist: IAutoMovieAngleRange | null | undefined = rom[bone]?.twist;
        if (twist === null || twist === undefined)
          throw new Error(`The range-of-motion table gives ${bone} no twist`);
        return Math.min(-twist.min, twist.max);
      },
    ),
  );
}
