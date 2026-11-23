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

import { AutoMovieMotionHumanArmReach } from "../compose/AutoMovieMotionHumanArmReach";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { placeHumanHandSurface } from "../posture/placeHumanHandSurface";
import { poseBones } from "../posture/poseBones";
import { HumanMountRider } from "./HumanMountRider";
import type { HumanRideHands } from "./HumanRideHands";

/**
 * The angle a rein crosses the holding palm at (`HumanRideHands`): the turn
 * of the hold about its outward normal from fingers square across the line.
 * A fist closes on a rein at any crossing; the line runs diagonally through
 * it, from the little finger to between the thumb and index. Held square
 * across a line that runs forward with the palm down, the hand is sent past
 * its forearm's twist and wrist ranges, and every fit of the arm trades the
 * hand's place against that attitude its own way, so two laws holding the
 * same rein show the arm on two branches. The crossing is chosen once per
 * plan. A hand that takes the rein takes the reachable turn nearest the
 * square (`AutoMovieMotionHumanArmReach.attitude`). A hand already holding
 * where the plan begins keeps the turn it was held with: the twist about the
 * normal, from the square hold, of the rotation its arm's goal asked in the
 * law before (the displayed hand's where that law gave none), so the goal
 * continues across the cut.
 *
 * @param body The body.
 * @param side The holding hand.
 * @param posture The rider's posture where the hold begins, leant to the grips.
 * @param grip The hold where it begins, its fingers' side chosen.
 * @param palm The hand's palm frame the rein is met with.
 * @param shown The pose and posture where the plan begins, for a hand already holding; none for a hand that takes the rein.
 * @returns The turn about the hold's outward normal, degrees.
 * @throws {HumanRefusal} When no turn about the normal brings the asked attitude within the forearm's twist and wrist ranges at the hand's place (`AutoMovieMotionHumanArmReach.attitude`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the freedom, the defect a square hold causes, both ways the turn is read and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The crossing is the one free coordinate of a fist's hold on a round line. A taking hand reads the reachable turn nearest the square by the rig's own arm fit (Tolani, Goswami and Badler 2000, §3.2.4); a holding hand reads the twist about the normal (swing-twist decomposition) of the turn the law before asked it, so a law that continues a hold continues its goal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The square hold, then one of two readings.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable crossing is refused by the reach owner, never clamped.
 * @evidence contracts/development/implementation.md#efficient-algorithms Once per plan and holding hand: a read of the entry's goal, or one forward-kinematics read where it has none, for a holding hand; the reach owner's bounded scan for a taking one.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanMountRider.wrist` for the square hold, `placeHumanHandSurface` for the wrist and `AutoMovieMotionHumanArmReach.attitude` for the reach.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a number and retains nothing.
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
