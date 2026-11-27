import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import type { pickUpPosture } from "./pickUpPosture";

/*
 * Actual holding shoulder through its same-body fixed-name reader, world
 * metres.
 */
export function pickUpAdjustShoulder(
  side: AutoMovieHumanSide,
  posture: IAutoMovieMotionHumanPosture,
  read: ReturnType<typeof HumanTrunk.prepareResolve>,
  resolution?: IFK,
): IAutoMovieVector3 {
  return read(posture, resolution).get(`${side}UpperArm`)!.worldPosition;
}

/*
 * Same-person exact FK loan borrowed by an actual adjusted stance invocation.
 */
type IFK = Parameters<pickUpPosture.IStance["at"]>[1];
