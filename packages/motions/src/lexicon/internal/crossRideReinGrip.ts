import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanMountRider,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmReach } from "../../compose/internal/AutoMovieMotionHumanArmReach";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { placeHumanHandSurface } from "../../posture/internal/placeHumanHandSurface";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanMountRider } from "./HumanMountRider";
import type { HumanRideHands } from "./HumanRideHands";

/**
 * The angle a rein crosses the holding palm at (`HumanRideHands`): the turn of
 * the hold about its outward normal from fingers square across the line. A fist
 * closes on a rein at any crossing; the line runs diagonally through it, from
 * the little finger to between the thumb and index. Held square across a line
 * that runs forward with the palm down, the hand is sent past its forearm's
 * twist and wrist ranges, and every fit of the arm trades the hand's place
 * against that attitude its own way, so two laws holding the same rein show the
 * arm on two branches. The crossing is chosen once per plan. A hand that takes
 * the rein takes the reachable turn nearest the square
 * (`AutoMovieMotionHumanArmReach.attitude`). A hand already holding where the
 * plan begins keeps the turn it was held with: the twist about the normal, from
 * the square hold, of the rotation its arm's goal asked in the law before (the
 * displayed hand's where that law gave none), so the goal continues across the
 * cut.
 *
 * @param body The body.
 * @param side The holding hand.
 * @param posture The rider's posture where the hold begins, leant to the grips.
 * @param grip The hold where it begins, its fingers' side chosen.
 * @param palm The hand's palm frame the rein is met with.
 * @param shown The pose and posture where the plan begins, for a hand already
 *   holding; none for a hand that takes the rein.
 * @returns The turn about the hold's outward normal, degrees.
 * @throws {HumanRefusal} When no turn about the normal brings the asked
 *   attitude within the forearm's twist and wrist ranges at the hand's place
 *   (`AutoMovieMotionHumanArmReach.attitude`).
 */
export function crossRideReinGrip(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  posture: IAutoMovieMotionHumanPosture,
  grip: IAutoMovieMotionHumanMountRider.IHoldGrip,
  palm: IAutoMovieMotionHumanHand.IFrame,
  shown?: HumanRideHands.IShown,
): number {
  const square: IAutoMovieQuaternion = HumanMountRider.wrist(
    body,
    posture,
    grip,
  ).rotation!;
  const normal: IAutoMovieVector3 = Vector3.normalize(grip.normal);
  if (shown !== undefined) {
    // The hand's turn as the law before asked it, its arm's goal, so the hold continues that goal exactly; the displayed hand where it gave none.
    const asked: IAutoMovieQuaternion | undefined =
      shown.posture.limbs[`${side}Arm`]?.rotation;
    const bone: AutoMovieHumanoidBone = `${side}Hand`;
    const turned: IAutoMovieQuaternion =
      asked ??
      poseBones(
        body,
        shown.pose,
        undefined,
        new Set<AutoMovieHumanoidBone>([bone]),
      ).get(bone)!.worldRotation;
    const delta: IAutoMovieQuaternion = Quaternion.multiply(
      turned,
      Quaternion.inverse(square),
    );
    const twist: number =
      (2 *
        Math.atan2(
          delta.x * normal.x + delta.y * normal.y + delta.z * normal.z,
          delta.w,
        ) *
        180) /
      Math.PI;
    return twist - 360 * Math.round(twist / 360);
  }
  const skin: IAutoMovieVector3 = Vector3.addScaled(
    grip.point,
    grip.normal,
    grip.radius ?? 0,
  );
  return AutoMovieMotionHumanArmReach.attitude({
    body,
    posture,
    side,
    bend: AutoMovieMotionHumanBend.hang(body, posture, side, 0.2),
    requested: square,
    axis: normal,
    wrist: (rotation: IAutoMovieQuaternion): IAutoMovieVector3 =>
      placeHumanHandSurface(palm.point, skin, rotation).point,
    name: "hands",
  }).turn;
}
