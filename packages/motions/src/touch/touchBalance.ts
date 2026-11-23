import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanTouchStance,
} from "@automovie/interface";

import { AutoMovieMotionHumanRoot } from "../compose/AutoMovieMotionHumanRoot";
import { HumanBalance } from "../everyday/HumanBalance";
import { prepareHumanTrunkBalance } from "../everyday/prepareHumanTrunkBalance";
import { HumanPhysics } from "../law/HumanPhysics";

/**
 * Prepare the requested correction for a grounded touch. The stance is
 * already written when the correction reads it. The arm reaches its fixed
 * site from the corrected body, and the existing hip or lumbar balance
 * owner sees that arm's geometric demand when it places the mass.
 *
 * @param body The canonical body.
 * @param window The admitted action-local balance window.
 * @param side The working arm.
 * @param arm The arm's working goal on the current stance.
 * @returns The correction, or none when balance does not apply.
 */
export function touchBalance(
  body: IAutoMovieMotionHumanBody,
  window: HumanPhysics.Window,
  side: AutoMovieHumanSide,
  arm: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieHumanLimbGoal,
): IAutoMovieMotionHumanTouchStance.ICorrection | undefined {
  if (window === null) return undefined;
  const trunk: ReturnType<typeof prepareHumanTrunkBalance> | undefined =
    window.by === "trunk" ? prepareHumanTrunkBalance(body) : undefined;
  return {
    channel: trunk === undefined ? "root" : "trunk",
    write: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      _before?: IAutoMovieMotionHumanPrimitive.Reader,
      resolution?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[3],
      projection?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[4],
    ): IAutoMovieMotionHumanPosture => {
      const weight: number = HumanPhysics.weightAt(window, seconds);
      if (weight === 0) return posture;
      const limb: IAutoMovieHumanLimbGoal = arm(posture);
      const weighed: IAutoMovieMotionHumanPosture = {
        ...posture, limbs: { ...posture.limbs, [`${side}Arm`]: limb },
      };
      if (trunk !== undefined) {
        const settled: IAutoMovieMotionHumanPosture = trunk(weighed, weight, resolution, projection);
        return { ...posture, joints: settled.joints };
      }
      const moved = (back: number): IAutoMovieMotionHumanPosture =>
        AutoMovieMotionHumanRoot.place(weighed, { point: { x: 0, y: 0, z: -back }, yaw: 0 });
      const touched: number = HumanBalance.shift(body, moved);
      return touched === 0 ? posture : { ...posture, root: moved(touched * weight).root };
    },
  };
}
