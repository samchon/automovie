import {
  type IAutoMovieCreateDynamicActorJabClip,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";

import { ease } from "../../motion/internal/ease";
import { actorWeightedArmPose } from "./actorWeightedArmPose";
import { createDynamicActorPoseClip } from "./createDynamicActorPoseClip";

/**
 * Bake a moving strike goal with an easeIn envelope to the 40% peak and easeOut
 * retraction over the remaining positive second duration. An unresolved target
 * sample returns null.
 */
export function createDynamicActorJabClip(
  props: IAutoMovieCreateDynamicActorJabClip.IProps,
): IAutoMovieMotion | null {
  const peakAt: number = props.duration * 0.4;
  return createDynamicActorPoseClip({
    ...props,
    landmarks: [peakAt],
    poseAt: (time: number): IAutoMoviePose | null => {
      const pose: IAutoMoviePose | null = props.poseAt(time);
      if (pose === null) return null;
      const weight: number =
        time <= peakAt
          ? ease("easeIn", time / peakAt)
          : 1 - ease("easeOut", (time - peakAt) / (props.duration - peakAt));
      return actorWeightedArmPose(props.skeleton, pose, weight);
    },
  });
}
