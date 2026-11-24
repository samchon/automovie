import { getConstraint, jointRomOvershoot } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  HumanArmClearance,
  HumanColliders,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";

import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * Forearm clearing preserves joint freedom and keeps obstacles outside the arm.
 *
 * Scenarios:
 * 1. An arm already within its allowance is kept.
 * 2. An obstructed arm changes only upper-arm abduction and elbow flexion. An
 *    independent feasible candidate exposes any remaining avoidable overlap.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the retained joint coordinates and the two clearance branches.
 * @evidence contracts/development/testing.md#behavioral-verification Clears real arms on opposite sides of the two stature extremes, verifies unchanged coordinates and joint range, and measures the remaining overshoot.
 * @evidence contracts/development/testing.md#independent-expectations The documented range and residual limits are unchanged. An independent grid is only needed after a residual that could have been avoided.
 * @evidence contracts/development/testing.md#distinguishing-cases Preserves the twist and adduction corners, a flexed elbow and a second performer's obstacle for both arms.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test owns the actual rigs and bounds all candidate evaluations to its shared per-arm geometry and range.
 */
export function test_motion_contact_arm_clearance(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const partner: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const partnered: IAutoMovieMotionHumanColliders.IPlaced[] =
    HumanColliders.placed(
      partner,
      poseBones(
        partner,
        resolveHumanPosture(
          partner,
          AutoMovieMotionHumanStance.stand.posture(
            partner,
            { x: 0, y: 0, z: 0.4 },
            180,
          ),
        ),
      ),
    );
  for (const [name, side] of [
    ["f-small", "left"],
    ["m-large", "right"],
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const posture: IAutoMovieMotionHumanPosture =
      AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
    const pose: IAutoMoviePose = resolveHumanPosture(body, posture);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
    );
    const placed: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(body, bones);
    const cell: string = `${name} ${side}`;
    const upperBone: AutoMovieHumanoidBone = `${side}UpperArm`;
    const lowerBone: AutoMovieHumanoidBone = `${side}LowerArm`;
    const upperConstraint: Constraint = constraint(body, upperBone);
    const lowerConstraint: Constraint = constraint(body, lowerBone);
    const own: IAutoMovieMotionHumanArmClearance.IArm = {
      upper: triple(pose, `${side}UpperArm`),
      lower: triple(pose, `${side}LowerArm`),
      hand: triple(pose, `${side}Hand`),
    };
    const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const stance: number = HumanArmClearance.overshoot(
      body,
      placed.filter(
        (s: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          TRUNK.includes(s.bone) ||
          s.bone === "leftUpperLeg" ||
          s.bone === "rightUpperLeg" ||
          s.bone === `${other}UpperArm` ||
          s.bone === `${other}LowerArm` ||
          s.bone === `${other}Hand`,
      ),
      bones.get(`${side}LowerArm`)!.worldPosition,
      bones.get(`${side}Hand`)!.worldPosition,
      side,
    );

    // 1. An arm within its allowance is kept.
    complaints.equals(
      `${cell}: an arm within its allowance is kept`,
      HumanArmClearance.cleared(body, pose, side, own, stance + 1),
      own,
    );
    // 2. The cells' arms, each cleared only as the function promises.
    const arms: [
      string,
      IAutoMovieMotionHumanArmClearance.IArm,
      IAutoMovieMotionHumanColliders.IPlaced[],
    ][] = [];
    for (const twist of [-60, 60])
      for (const abduction of [-20, 0])
        arms.push([
          `hanging, turned ${twist}, adducted ${-abduction}, elbow 95`,
          {
            upper: [0, abduction, twist],
            lower: [95, 0, 0],
            hand: [0, 0, 0],
          },
          [],
        ]);
    arms.push([
      "flexed 30, elbow 120",
      { upper: [30, -15, 0], lower: [120, 0, 0], hand: [0, 0, 0] },
      [],
    ]);
    arms.push([
      "raised 80 into a partner",
      { upper: [80, 0, 0], lower: [10, 0, 0], hand: [0, 0, 0] },
      partnered,
    ]);
    for (const [label, arm, others] of arms) {
      const before: number = HumanArmClearance.room(
        body,
        pose,
        side,
        arm,
        others,
      );
      if (before <= 1) continue;
      const what: string = `${cell} ${label}`;
      const after: IAutoMovieMotionHumanArmClearance.IArm =
        HumanArmClearance.cleared(body, pose, side, arm, 0, others);
      complaints.check(
        `${what}: only the abduction and the elbow's flexion turn`,
        after.upper[0] === arm.upper[0] &&
          after.upper[2] === arm.upper[2] &&
          after.lower[1] === arm.lower[1] &&
          after.lower[2] === arm.lower[2] &&
          JSON.stringify(after.hand) === JSON.stringify(arm.hand),
      );
      const range = (of: IAutoMovieMotionHumanArmClearance.IArm): number =>
        outside(upperBone, upperConstraint, of.upper) +
        outside(lowerBone, lowerConstraint, of.lower);
      const originalRange: number = range(arm);
      const changedRange: number = range(after);
      complaints.check(
        `${what}: range ${changedRange.toFixed(3)} deg out, before ${originalRange.toFixed(3)}`,
        changedRange <= originalRange + 1e-9,
      );
      const left: number = HumanArmClearance.room(
        body,
        pose,
        side,
        after,
        others,
      );
      complaints.check(
        `${what}: overshoot ${left.toFixed(3)} after clearing, ${before.toFixed(3)} before`,
        left <= before,
      );
      if (left <= CLEARED) continue;
      let reachable: number = Infinity;
      for (let a: number = -40; a <= 40 && reachable > CLEARED; a += 5)
        for (let f: number = -40; f <= 40 && reachable > CLEARED; f += 5) {
          const turned: IAutoMovieMotionHumanArmClearance.IArm = {
            upper: [arm.upper[0], arm.upper[1] + a, arm.upper[2]],
            lower: [arm.lower[0] + f, arm.lower[1], arm.lower[2]],
            hand: arm.hand,
          };
          if (range(turned) > originalRange + 1e-9) continue;
          reachable = Math.min(
            reachable,
            HumanArmClearance.room(body, pose, side, turned, others),
          );
        }
      complaints.check(
        `${what}: overshoot ${left.toFixed(3)} after clearing where a turn within 40 deg reaches ${reachable.toFixed(3)}`,
        reachable > CLEARED,
      );
    }
  }
  complaints.assert(
    "Each forearm achieves its feasible clearance within its two freedoms",
  );
}

/** The existing clearance allowance for a reachable arm, degrees. */
const CLEARED: number = 0.05;

/** The effective range record, which may be absent for an unconstrained joint. */
type Constraint = ReturnType<typeof getConstraint>;

/** The bones of the trunk a forearm may not enter. */
const TRUNK: readonly AutoMovieHumanoidBone[] = [
  "hips",
  "spine",
  "chest",
  "upperChest",
  "neck",
  "head",
];

/** A joint's triple in a pose; zero when the pose does not carry it. */
function triple(
  pose: IAutoMoviePose,
  bone: AutoMovieHumanoidBone,
): readonly [number, number, number] {
  const joint: OptionalJoint = pose.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === bone,
  );
  return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
}

/** A joint's range of motion overshoot at a triple, degrees. */
function outside(
  bone: AutoMovieHumanoidBone,
  limit: Constraint,
  of: readonly [number, number, number],
): number {
  return jointRomOvershoot(
    { bone, flexion: of[0], abduction: of[1], twist: of[2] },
    limit,
  );
}

/** The subject's effective limit is shared by every read of this joint. */
function constraint(
  body: IAutoMovieMotionHumanBody,
  bone: AutoMovieHumanoidBone,
): Constraint {
  return getConstraint(
    bone,
    body.skeleton.bones.find((b: IAutoMovieBone): boolean => b.bone === bone)
      ?.constraint ?? null,
  );
}

/** The explicitly authored joint when present. */
type OptionalJoint = IAutoMovieJointPose | undefined;
