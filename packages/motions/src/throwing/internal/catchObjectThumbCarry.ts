import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { motionClock } from "../../compose/internal/motionClock";
import { motionHumanChannel } from "../../compose/internal/motionHumanChannel";
import { HumanHand } from "../../posture/internal/HumanHand";

/*
 * Give the distal thumbs room as two palms carry a secured ball in toward the
 * moving trunk. The wrists keep their admitted course and the distal thumbs
 * ease to flat as the ball approaches, then return during the held beat.
 */
export function catchObjectThumbCarry(
  posture: IAutoMovieMotionHumanActionPlan["posture"],
  clock: IAutoMovieMotionClock,
): IAutoMovieMotionHumanActionPlan["posture"] {
  const carry = motionClock.prepare(clock, "secured", "held").linear;
  const held = motionClock.prepare(clock, "held", "end").linear;
  const thumbs = (["left", "right"] as const).map((side) => {
    const bone = `${side}ThumbDistal` as const;
    return { bone, flat: HumanHand.shape(side, "flat")[bone]![0] };
  });
  return (seconds, channels, resolution, projection) => {
    const placed = posture(seconds, channels, resolution, projection);
    const u = carry(seconds);
    const v = held(seconds);
    const share = u * u * (3 - 2 * u) * (1 - v * v * (3 - 2 * v));
    if (share === 0) return placed;
    let joints: IAutoMovieMotionHumanPosture["joints"] | undefined;
    for (const { bone, flat } of thumbs) {
      if (channels !== undefined && !motionHumanChannel.covers(channels, bone))
        continue;
      const angle = placed.joints[bone];
      if (angle === undefined || angle[0] === flat) continue;
      (joints ??= { ...placed.joints })[bone] = [
        angle[0] + (flat - angle[0]) * share,
        angle[1],
        angle[2],
      ];
    }
    return joints === undefined ? placed : { ...placed, joints };
  };
}
