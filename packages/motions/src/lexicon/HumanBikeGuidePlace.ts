import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanBikeGuideStance } from "./HumanBikeGuideStance";
import type { IHumanBikeGuidePrint } from "./IHumanBikeGuidePrint";

/** Toe clearance at mid-swing, metres: provisional for a hurried walk. */
const CLEARANCE: number = 0.06;

/**
 * Where a foot is at a second. On its print the ball stays put while, over the
 * second half of the stance, the heel rises about it to `ROCKER` degrees by
 * lift-off (Perry's forefoot rocker); between prints the foot swings from that
 * lifted pose to the next print with a clearance pulse.
 */
export function HumanBikeGuidePlace(
  prints: readonly IHumanBikeGuidePrint[],
  t: number,
  ball: IAutoMovieVector3,
): IHumanBikeGuidePrint {
  for (let i: number = 0; i < prints.length; ++i) {
    const now: IHumanBikeGuidePrint = prints[i]!;
    const next: IHumanBikeGuidePrint | undefined = prints[i + 1];
    if (next === undefined || t <= now.lift)
      return HumanBikeGuideStance(now, t, ball);
    if (t < next.land) {
      const from: IHumanBikeGuidePrint = HumanBikeGuideStance(
        now,
        now.lift,
        ball,
      );
      const share: number = AutoMovieEngineMotionSampling.minimumJerkShare(
        (t - now.lift) / (next.land - now.lift),
      );
      const ankle: IAutoMovieVector3 = Vector3.lerp(
        from.ankle,
        next.ankle,
        share,
      );
      return {
        land: Infinity,
        lift: -Infinity,
        ankle: {
          ...ankle,
          y: ankle.y + CLEARANCE * Math.sin(Math.PI * share) ** 2,
        },
        rotation: Quaternion.slerp(from.rotation, next.rotation, share),
      };
    }
  }
  return HumanBikeGuideStance(prints.at(-1)!, t, ball);
}
