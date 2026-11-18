import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPhysics } from "../law/HumanPhysics";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanBalance } from "./HumanBalance";
import { prepareHumanTrunkBalance } from "./prepareHumanTrunkBalance";

/** A correction on a pose whose two feet bear, before a reaching arm is fitted. */
export function prepareGroundedBalance(
  body: IAutoMovieMotionHumanBody,
  window: HumanPhysics.Window,
): IAutoMovieMotionHumanPrimitive["write"] {
  let trunk: ReturnType<typeof prepareHumanTrunkBalance> | undefined;
  return (posture, seconds, _before, resolution, projection): IAutoMovieMotionHumanPosture => {
    const weight: number = HumanPhysics.weightAt(window, seconds);
    if (weight === 0 || window === null) return posture;
    if (window.by === "trunk") {
      trunk ??= prepareHumanTrunkBalance(body);
      return trunk(posture, weight, resolution, projection);
    }

    // Intersect the sagittal line of travel with the hull of the bearing soles.
    const direction: IAutoMovieVector3 = HumanFrame.forward(posture.yaw);
    const shift: HumanPhysics.SupportOffset = HumanPhysics.supportOffset(
      HumanBalance.support(body, posture, resolution, projection), direction,
    );
    return shift === null || shift === 0 ? posture : {
      ...posture, root: Vector3.addScaled(posture.root, direction, weight * shift),
    };
  };
}
