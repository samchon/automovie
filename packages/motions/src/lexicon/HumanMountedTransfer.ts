import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanMountedPaths } from "./HumanMountedPaths";

/** A limb's joints by bone, clinical degrees `[flexion, abduction, twist]`. */
type Joints = IAutoMovieMotionHumanPosture["joints"];

/**
 * Shape a transfer between two keys at a share of it, in place on the blended
 * posture: each limb end turns the same share as it moves (a foot kept on its
 * rest turning about its ball), each handed-off limb blends joints to joints,
 * the hips swing between the keys about the feet kept on their stirrups
 * (`HumanMountedPaths.swing`), and a leg rises over the carrier on its arc.
 * Outside a transfer (share 0 or 1) the posture is left as blended.
 *
 * @param local The keys' blend at the share, the contact's frame; reshaped.
 * @param from The transfer's first key.
 * @param to The transfer's second key.
 * @param share The transfer's share.
 * @param pivot The ball each foot kept on its rest pivots about, by side.
 * @param handoff Each handed-off limb's fitted joints by bone.
 * @param arc Each leg's arc over the carrier, by side.
 * @param before The hips at the first key.
 * @param after The hips at the second key.
 * @param hipsOf The hips of a posture.
 */
export function HumanMountedTransfer(
  local: IAutoMovieMotionHumanPosture,
  from: IAutoMovieMotionHumanPosture,
  to: IAutoMovieMotionHumanPosture,
  share: number,
  pivot: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
  handoff: Partial<Record<AutoMovieHumanLimb, Joints>>,
  arc: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
  before: IAutoMovieVector3,
  after: IAutoMovieVector3,
  hipsOf: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieVector3,
): void {
  // A transfer between two keys turns each limb's end the same share as it moves it, rather than holding the earlier key's turn until it snaps at the arrival; a foot kept on its rest turns about the ball on it, so the ball stays on the rest.
  if (share > 0 && share < 1)
    for (const limb of [
      "leftArm",
      "rightArm",
      "leftLeg",
      "rightLeg",
    ] as const) {
      const a: IAutoMovieHumanLimbGoal | undefined = from.limbs[limb];
      const b: IAutoMovieHumanLimbGoal | undefined = to.limbs[limb];
      const goal: IAutoMovieHumanLimbGoal | undefined = local.limbs[limb];
      if (
        goal === undefined ||
        a?.rotation === undefined ||
        b?.rotation === undefined
      )
        continue;
      const rotation: IAutoMovieQuaternion = Quaternion.slerp(
        a.rotation,
        b.rotation,
        share,
      );
      const ball: IAutoMovieVector3 | undefined =
        limb === "leftLeg"
          ? pivot.left
          : limb === "rightLeg"
            ? pivot.right
            : undefined;
      local.limbs = {
        ...local.limbs,
        [limb]: {
          ...goal,
          rotation,
          ...(ball === undefined || goal.contact === undefined
            ? {}
            : {
                point: Vector3.subtract(
                  ball,
                  Quaternion.rotateVector(rotation, goal.contact),
                ),
              }),
        },
      };
    }
  if (share > 0 && share < 1)
    for (const [limb, fitted] of Object.entries(handoff) as [
      AutoMovieHumanLimb,
      Joints,
    ][]) {
      const goalFirst: boolean = from.limbs[limb] !== undefined;
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
        ...local.limbs,
      };
      delete limbs[limb];
      const joints: IAutoMovieMotionHumanPosture["joints"] = {
        ...local.joints,
      };
      for (const [bone, angles] of Object.entries(fitted) as [
        AutoMovieHumanoidBone,
        readonly [number, number, number],
      ][]) {
        const other: readonly [number, number, number] = (goalFirst ? to : from)
          .joints[bone] ?? [0, 0, 0];
        const [a, b] = goalFirst ? [angles, other] : [other, angles];
        joints[bone] = [
          a[0] + (b[0] - a[0]) * share,
          a[1] + (b[1] - a[1]) * share,
          a[2] + (b[2] - a[2]) * share,
        ];
      }
      local.limbs = limbs;
      local.joints = joints;
    }
  // The hips travel between the keys while the pelvis turns about them, swinging about feet kept on their stirrups so no leg is stretched or folded past both ends.
  if (share > 0 && share < 1)
    local.root = Vector3.add(
      local.root,
      Vector3.subtract(
        HumanMountedPaths.swing(
          before,
          after,
          HumanMountedPaths.pivot(from, to),
          share,
        ),
        hipsOf(local),
      ),
    );
  if (share > 0 && share < 1)
    for (const [side, over] of Object.entries(arc) as [
      AutoMovieHumanSide,
      IAutoMovieVector3,
    ][]) {
      const goal: IAutoMovieMotionHumanPosture["limbs"]["leftLeg"] =
        local.limbs[`${side}Leg`]!;
      const middle: IAutoMovieVector3 = Vector3.lerp(
        from.limbs[`${side}Leg`]!.point,
        to.limbs[`${side}Leg`]!.point,
        0.5,
      );
      local.limbs = {
        ...local.limbs,
        [`${side}Leg`]: {
          ...goal,
          point: Vector3.add(
            goal.point,
            Vector3.scale(
              Vector3.subtract(over, middle),
              4 * share * (1 - share),
            ),
          ),
        },
      };
    }
}
