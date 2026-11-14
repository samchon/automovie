import {
  type IAutoMovieResolvedBone,
  getConstraint,
  jointRomOvershoot,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  HumanArmClearance,
  HumanColliders,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import type { motionComplaints } from "./motionComplaints";
import { motionHumanBody } from "./motionHumanBody";

/**
 * A forearm's clearing (`HumanArmClearance.cleared`) on one real body in the
 * quiet stance, which the `test_human_motion_posture_arm_clearing_*` specs
 * read one body each.
 *
 * Scenarios, per arm of the body:
 * 1. An arm within its allowance is kept as it is.
 * 2. For each arm of the cells (hanging turned 60 either way and adducted 0
 *    or 20 with the elbow at 95, flexed 30 with the elbow at 120, and raised
 *    80 into a partner, the average man, standing 0.4 m ahead) that lacks
 *    more than a degree, the clearing changes only the upper arm's abduction
 *    and the elbow's flexion, keeps the hand, never leaves a joint's range
 *    farther than the arm was, never worsens the overshoot, and clears it to
 *    within 0.05 degrees wherever a turn within 40 degrees of each freedom
 *    and within range does (decided by a grid search the function does not
 *    do).
 *
 * @param complaints The gatherer the checks are written to.
 * @param name The body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the body, the cells and the 2 scenarios with their bounds.
 * @evidence contracts/development/implementation.md#principled-implementation Clears real arms of a real body and reads the room before and after through the public functions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the arms, then over the cells, one check per promise.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The reachability is decided by a grid search the function does not do; the bounds are the function's documented promises, unchanged by the split.
 * @evidence contracts/development/implementation.md#efficient-algorithms A 17 by 17 grid per cell that lacks room.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by each body's spec, so the reading is written once.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
 */
export function motionArmClearing(
  complaints: motionComplaints.IGatherer,
  name: motionHumanBody.Name,
): void {
  const partner: IHumanBody = motionHumanBody("m-average");
  const partnered: HumanColliders.IPlaced[] = HumanColliders.placed(
    partner,
    poseBones(
      partner,
      resolveHumanPosture(
        partner,
        stand.posture(partner, { x: 0, y: 0, z: 0.4 }, 180),
      ),
    ),
  );
  const body: IHumanBody = motionHumanBody(name);
  const posture: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const pose: IAutoMoviePose = resolveHumanPosture(body, posture);
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    pose,
  );
  const placed: HumanColliders.IPlaced[] = HumanColliders.placed(body, bones);
  for (const side of ["left", "right"] as const) {
    const cell: string = `${name} ${side}`;
    const own: HumanArmClearance.IArm = {
      upper: triple(pose, `${side}UpperArm`),
      lower: triple(pose, `${side}LowerArm`),
      hand: triple(pose, `${side}Hand`),
    };
    const other: "left" | "right" = side === "left" ? "right" : "left";
    const stance: number = HumanArmClearance.overshoot(
      body,
      placed.filter(
        (s: HumanColliders.IPlaced): boolean =>
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
    const arms: [string, HumanArmClearance.IArm, HumanColliders.IPlaced[]][] =
      [];
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
      const after: HumanArmClearance.IArm = HumanArmClearance.cleared(
        body,
        pose,
        side,
        arm,
        0,
        others,
      );
      complaints.check(
        `${what}: only the abduction and the elbow's flexion turn`,
        after.upper[0] === arm.upper[0] &&
          after.upper[2] === arm.upper[2] &&
          after.lower[1] === arm.lower[1] &&
          after.lower[2] === arm.lower[2] &&
          JSON.stringify(after.hand) === JSON.stringify(arm.hand),
      );
      const range = (of: HumanArmClearance.IArm): number =>
        outside(body, `${side}UpperArm`, of.upper) +
        outside(body, `${side}LowerArm`, of.lower);
      complaints.check(
        `${what}: range ${range(after).toFixed(3)} deg out, before ${range(arm).toFixed(3)}`,
        range(after) <= range(arm) + 1e-9,
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
      let reachable: number = Infinity;
      for (let a: number = -40; a <= 40; a += 5)
        for (let f: number = -40; f <= 40; f += 5) {
          const turned: HumanArmClearance.IArm = {
            upper: [arm.upper[0], arm.upper[1] + a, arm.upper[2]],
            lower: [arm.lower[0] + f, arm.lower[1], arm.lower[2]],
            hand: arm.hand,
          };
          if (range(turned) > range(arm) + 1e-9) continue;
          reachable = Math.min(
            reachable,
            HumanArmClearance.room(body, pose, side, turned, others),
          );
        }
      complaints.check(
        `${what}: overshoot ${left.toFixed(3)} after clearing where a turn within 40 deg reaches ${reachable.toFixed(3)}`,
        reachable > 0.05 || left <= 0.05,
      );
    }
  }
}

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
  const joint: IAutoMovieJointPose | undefined = pose.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === bone,
  );
  return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
}

/** A joint's range of motion overshoot at a triple, degrees. */
function outside(
  body: IHumanBody,
  bone: AutoMovieHumanoidBone,
  of: readonly [number, number, number],
): number {
  return jointRomOvershoot(
    { bone, flexion: of[0], abduction: of[1], twist: of[2] },
    getConstraint(
      bone,
      body.skeleton.bones.find((b: IAutoMovieBone): boolean => b.bone === bone)
        ?.constraint ?? null,
    ),
  );
}
