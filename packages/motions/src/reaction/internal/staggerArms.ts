import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { staggerBounds } from "./staggerBounds";
import { staggerRecover } from "./staggerRecover";

/*
 * A stagger's arms: both abduct from the entry's angles as balance reactions,
 * `staggerBounds.ABDUCTION` from `staggerBounds.ONSET` after the push to the
 * first step's landing (Weerdesteyn, Laing and Robinovitch 2008, Exp Brain Res
 * 186:571), and come down by a minimum-jerk share from the last step's landing
 * to the stagger's end, each let out further where it would pass into the body
 * by the plan-time carriage `carried` returns: the let-out of each side at a
 * second, left then right, from the plan's knot course.
 * Parameter body: The body.
 * Parameter entry: The entry state the arms abduct from.
 * Parameter recovery: The recovery whose first and last landings time the arms.
 * Parameter duration: The stagger's seconds.
 * Parameter carried: Returns the plan's let-out reader, degrees by side; none
 * before the plan has read it.
 * Returns: The arms' primitive over the whole stagger.
 */
export function staggerArms(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanEntryState,
  recovery: staggerRecover.IRecovery,
  duration: number,
  carried: () => ((seconds: number) => readonly number[]) | undefined,
): IAutoMovieMotionHumanPrimitive {
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
    const rise: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      Math.min(1, Math.max(0, (seconds - onset) / (swing - onset))),
    );
    const fall: number = AutoMovieEngineMotionSampling.minimumJerkShare(
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
      const series: ((seconds: number) => readonly number[]) | undefined =
        carried();
      const letOut: readonly number[] =
        series === undefined ? [0, 0] : series(seconds);
      const out = (side: AutoMovieHumanSide): number =>
        letOut[side === "left" ? 0 : 1]!;
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
