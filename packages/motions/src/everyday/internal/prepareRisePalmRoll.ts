import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { seatedPairDepth } from "./seatedPairDepth";

/** A loaded palm's fixed tangent turn and actual hand-local contact frame. */
interface IRoll {
  /** The side that needs forearm clearance. */
  side: AutoMovieHumanSide;
  /**
   * The tangent-plane rotation from fingers toward the projected forearm,
   * degrees.
   */
  angle: number;
  /** The material frame that stays on its site when the wrist turns. */
  palm: IAutoMovieMotionHumanHand.IFrame;
}

/**
 * At seat-off, let a loaded palm turn in its tangent plane where its forearm
 * runs into the trunk. Align the fingers with the incoming forearm projected on
 * the skin, preserving the contact point and normal.
 */
export function prepareRisePalmRoll(
  body: IAutoMovieMotionHumanBody,
  peak: IAutoMovieMotionHumanPosture,
  sides: readonly AutoMovieHumanSide[],
): (
  posture: IAutoMovieMotionHumanPosture,
  share: number,
) => IAutoMovieMotionHumanPosture {
  const rolls: IRoll[] = [];
  if (sides.length > 0) {
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture(body, peak),
    );
    const placed: ReturnType<typeof HumanColliders.placed> =
      HumanColliders.placed(body, bones);
    for (const side of sides) {
      if (seatedPairDepth(body, `${side}LowerArm`, "spine")(placed) <= 0)
        continue;
      const palm: IAutoMovieMotionHumanHand.IFrame = HumanHand.frame(
        body,
        bones,
        side,
        "palm",
        "flat",
      );
      const along: IAutoMovieVector3 = Vector3.subtract(
        bones.get(`${side}Hand`)!.worldPosition,
        bones.get(`${side}LowerArm`)!.worldPosition,
      );
      const tangent: IAutoMovieVector3 = Vector3.addScaled(
        along,
        palm.normal,
        -Vector3.dot(along, palm.normal),
      );
      const angle: number =
        (Math.atan2(
          Vector3.dot(Vector3.cross(palm.forward, tangent), palm.normal),
          Vector3.dot(palm.forward, tangent),
        ) *
          180) /
        Math.PI;
      rolls.push({
        side,
        angle,
        palm: HumanHand.offset(body, side, "palm", "flat"),
      });
    }
  }
  return (
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ): IAutoMovieMotionHumanPosture => {
    if (rolls.length === 0 || share <= 0) return posture;
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const { side, angle, palm } of rolls) {
      const goal: IAutoMovieHumanLimbGoal | undefined = limbs[`${side}Arm`];
      if (goal?.rotation === undefined) continue;
      const turned: IAutoMovieQuaternion = Quaternion.multiply(
        goal.rotation,
        Quaternion.prepareAxisAngle(palm.normal)(angle * share),
      );
      const site: IAutoMovieVector3 = Vector3.add(
        goal.point,
        Quaternion.rotateVector(goal.rotation, palm.point),
      );
      limbs[`${side}Arm`] = {
        ...goal,
        point: Vector3.subtract(
          site,
          Quaternion.rotateVector(turned, palm.point),
        ),
        rotation: turned,
      };
    }
    return { ...posture, limbs };
  };
}
