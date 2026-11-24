import { minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { staggerBounds } from "./staggerBounds";
import { staggerRecover } from "./staggerRecover";

/**
 * A stagger's arms: both abduct from the entry's angles as balance reactions,
 * `staggerBounds.ABDUCTION` from `staggerBounds.ONSET` after the push to the
 * first step's landing (Weerdesteyn, Laing and Robinovitch 2008, Exp Brain Res
 * 186:571), and come down by a minimum-jerk share from the last step's landing
 * to the stagger's end, each let out further where it would pass into the body
 * by the plan-time carriage `carried` returns: per side, one let-out a
 * `staggerBounds.KNOTS`-th of a second, interpolated between its samples.
 *
 * @param body The body.
 * @param entry The entry state the arms abduct from.
 * @param recovery The recovery whose first and last landings time the arms.
 * @param duration The stagger's seconds.
 * @param carried Returns the plan's let-out samples per side, degrees; empty
 *   before the plan has read them.
 * @returns The arms' primitive over the whole stagger.
 */
export function staggerArms(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanEntryState,
  recovery: staggerRecover.IRecovery,
  duration: number,
  carried: () => Record<AutoMovieHumanSide, number[]>,
): IAutoMovieMotionHumanPrimitive {
  const KNOTS: number = staggerBounds.KNOTS;
  const swing: number = recovery.steps[0]!.land;
  const held: Record<
    AutoMovieHumanSide,
    IAutoMovieMotionHumanArmAngles.IAngles
  > = {
    left: AutoMovieMotionHumanArm.angles(entry.pose, "left"),
    right: AutoMovieMotionHumanArm.angles(entry.pose, "right"),
  };
  const onset: number = AutoMovieMotionHumanTiming.seconds(staggerBounds.ONSET);
  const raised: (seconds: number) => number = (seconds: number): number => {
    const end: number = recovery.steps.at(-1)!.land;
    const rise: number = minimumJerk.share(
      Math.min(1, Math.max(0, (seconds - onset) / (swing - onset))),
    );
    const fall: number = minimumJerk.share(
      Math.min(1, Math.max(0, (seconds - end) / (duration - end))),
    );
    return staggerBounds.ABDUCTION * Math.max(0, rise - fall);
  };
  return {
    channels: ["leftArm", "rightArm"],
    from: 0,
    to: duration,
    write: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture => {
      const more: number = raised(seconds);
      const series: Record<AutoMovieHumanSide, number[]> = carried();

      // The let-out's envelope between the two samples around this second.
      const at: number = Math.min(
        Math.max(0, seconds * KNOTS),
        Math.max(0, series.left.length - 1),
      );
      const k: number = Math.floor(at);
      const out: (side: AutoMovieHumanSide) => number = (
        side: AutoMovieHumanSide,
      ): number => {
        const own: number[] = series[side];
        if (own.length === 0) return 0;
        const a: number = own[k]!;
        const b: number = own[Math.min(own.length - 1, k + 1)]!;
        return a + (b - a) * (at - k);
      };
      const abducted: (
        side: AutoMovieHumanSide,
      ) => IAutoMovieMotionHumanArmAngles.IAngles = (
        side: AutoMovieHumanSide,
      ): IAutoMovieMotionHumanArmAngles.IAngles => ({
        ...held[side],
        upper: [
          held[side].upper[0],
          held[side].upper[1] + more + out(side),
          held[side].upper[2],
        ],
      });
      return AutoMovieMotionHumanArm.carry(
        body,
        posture,
        { left: abducted("left"), right: abducted("right") },
        0,
      );
    },
  };
}
