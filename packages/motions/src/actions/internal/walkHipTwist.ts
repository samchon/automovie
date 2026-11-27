import { AutoMovieEngineDefaultHumanoidRom } from "@automovie/engine";
import type { IAutoMovieAngleRange } from "@automovie/interface";

/*
 * Read the least internal or external rotation available at either hip.
 * Parameter rom: The range-of-motion table, in degrees.
 * Returns: Degrees, the lesser way of the stiffer hip.
 * When the table gives a hip no twist interval.
 */
export function walkHipTwist(rom: typeof AutoMovieEngineDefaultHumanoidRom): number {
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

/*
 * The alternatives of `WalkHipTwistBone`'s site.
 */
type WalkHipTwistBone = "leftUpperLeg" | "rightUpperLeg";
