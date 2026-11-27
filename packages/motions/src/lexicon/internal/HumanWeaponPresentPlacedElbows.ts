import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanWeaponPresentElbowOn } from "./HumanWeaponPresentElbowOn";

/**
 * Two arms on one weapon with their elbows placed outside each other: at each
 * second each arm's elbow is put on the circle one upper arm from its shoulder
 * and one forearm from its wrist, at the point nearest outward and a little
 * down on its own side, and the goal names it authoritative (`elbow:
 * "placed"`); an arm whose wrist lies past its reach keeps the law's own hint.
 */
export function HumanWeaponPresentPlacedElbows(
  body: IAutoMovieMotionHumanBody,
  plan: IAutoMovieMotionHumanActionPlan,
  side: AutoMovieHumanSide,
): IAutoMovieMotionHumanActionPlan {
  const sides: readonly AutoMovieHumanSide[] = [
    side,
    side === "left" ? "right" : "left",
  ];
  return {
    ...plan,
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const posture: IAutoMovieMotionHumanPosture = plan.posture(
        seconds,
        channels,
        resolution,
        projection,
      );
      const trunk: ReturnType<typeof HumanTrunk.resolve> = HumanTrunk.resolve(
        body,
        posture,
      );
      const chest: IAutoMovieQuaternion = trunk.get("chest")!.worldRotation;
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
      for (const arm of sides) {
        const goal: IAutoMovieHumanLimbGoal | undefined = limbs[`${arm}Arm`];
        if (goal === undefined || goal.rotation === undefined) continue;
        const shoulder: IAutoMovieVector3 = trunk.get(
          `${arm}UpperArm`,
        )!.worldPosition;
        const wrist: IAutoMovieVector3 = HumanHand.place(
          body,
          arm,
          "grip",
          goal.point,
          goal.rotation,
          "relaxed",
        ).point;
        const outward: IAutoMovieVector3 = Vector3.normalize(
          Quaternion.rotateVector(chest, {
            x: arm === "left" ? 1 : -1,
            y: -0.5,
            z: 0,
          }),
        );
        const elbow: IAutoMovieVector3 | undefined = HumanWeaponPresentElbowOn(
          shoulder,
          wrist,
          body.measure.upperArm,
          body.measure.forearm,
          outward,
        );
        if (elbow === undefined) continue;
        limbs[`${arm}Arm`] = { ...goal, bend: elbow, elbow: "placed" };
      }
      return { ...posture, limbs };
    },
  };
}
