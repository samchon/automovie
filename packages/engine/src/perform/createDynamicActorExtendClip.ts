import {
  type IAutoMovieCreateDynamicActorExtendClip,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";

import { ease } from "../motion/ease";
import { actorWeightedArmPose } from "./actorWeightedArmPose";
import { createDynamicActorPoseClip } from "./createDynamicActorPoseClip";

/**
 * Bake a moving arm goal with an easeInOut extension over the first half of a
 * positive second duration, then hold its sampled solved articulation. An
 * unresolved target sample returns null.
 */
export const createDynamicActorExtendClip: (
  props: IAutoMovieCreateDynamicActorExtendClip.IProps,
) => IAutoMovieMotion | null = (
  props: IAutoMovieCreateDynamicActorExtendClip.IProps,
): IAutoMovieMotion | null => {
  const extendedAt: number = props.duration * 0.5;
  return createDynamicActorPoseClip({
    ...props,
    landmarks: [extendedAt],
    poseAt: (time: number): IAutoMoviePose | null => {
      const pose: IAutoMoviePose | null = props.poseAt(time);
      if (pose === null) return null;
      const weight: number =
        time >= extendedAt ? 1 : ease("easeInOut", time / extendedAt);
      return actorWeightedArmPose(props.skeleton, pose, weight);
    },
  });
};
