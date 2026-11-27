import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";

/** The shoulder joint of an arm in a posture, world metres. */
export function pickUpPostureShoulder(
  context: IAutoMovieMotionHumanActionContext<object>,
  side: AutoMovieHumanSide,
  posture: IAutoMovieMotionHumanPosture,
): IAutoMovieVector3 {
  return HumanTrunk.resolve(
    context.body,
    posture,
    undefined,
    undefined,
    new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]),
  ).get(`${side}UpperArm`)!.worldPosition;
}
