import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformanceAim,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import type { AutoMovieMotionHumanPerformance } from "@automovie/motions";

/**
 * A performer's own aiming frame read off a take at a film second: their
 * root and heading, their body and their displayed bones. A `none`
 * target's lines stand at the body's hip, chest and head heights, and its
 * distance is the arm's length.
 *
 * @param take The take.
 * @param subject The aiming performer.
 * @param body Their body.
 * @param seconds Film seconds.
 * @returns The frame.
 */
export function performanceAimFrame(
  take: AutoMovieMotionHumanPerformance,
  subject: string,
  body: IAutoMovieMotionHumanBody,
  seconds: number,
): IAutoMovieMotionHumanPerformanceAim.IFrame {
  const posture: IAutoMovieMotionHumanPosture = take.posture(subject, seconds);
  return {
    subject,
    body,
    root: posture.root,
    yaw: posture.yaw,
    heights: {
      low: body.measure.hipHeight,
      middle: body.measure.chestHeight,
      high: body.measure.headHeight,
    },
    range: body.measure.upperArm + body.measure.forearm,
    bones: (): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      take.bones(subject, seconds),
  };
}
