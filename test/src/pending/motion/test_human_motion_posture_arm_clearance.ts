import {
  type IAutoMovieResolvedBone,
  Quaternion,
  getConstraint,
  jointRomOvershoot,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieVector3,
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

import { motionComplaints } from "../../features/internal/motionComplaints";
import { motionHumanBody } from "../../features/internal/motionHumanBody";

/**
 * A forearm's need for room beside the trunk (`HumanArmClearance`) and the
 * placed colliders it is read against (`HumanColliders`), on real bodies in
 * the quiet stance.
 *
 * The overshoot is documented as degrees of upper arm turn: metres of room
 * lacking divided by the upper arm's length. Its two rules are checked on
 * forearms placed where only one rule can act. Far ahead of the body no
 * collider is within a forearm's radius, so only the chest's median plane
 * acts: an elbow `e` metres across it with its wrist on its own side lacks
 * the forearm's radius `r` plus `e`, and an elbow that stays nearer the
 * median plane than a wrist sent across it lacks nothing. Against the chest
 * itself, the needed clearance falls from `r` at the elbow toward the wrist
 * but never below `r` less the 10 mm of tissue the contact verdicts let
 * press in, plus the wrist's own depth where a goal put it: an axis standing
 * 400 mm out along the surface's normal from a wrist 10 mm under a palm laid
 * on the chest's front lacks nothing beyond the median plane's term, because
 * every sample stands at least 40 mm out, more than `r - 0.01` for every
 * body; a 250 mm forearm whose wrist is 60 mm into another body's chest
 * lacks more than an eighth of `r`, because its last sample, 7/8 of the way
 * to the wrist, lies inside the shape and nothing excuses it.
 *
 * A clearing (`cleared`) turns only the upper arm's abduction and the
 * elbow's flexion, never further out of range, never to a larger overshoot,
 * and where some turn of those two joints within 40 degrees each and within
 * range clears the arm to its allowance, it clears the arm to within the
 * documented tolerance of 0.05 degrees.
 *
 * The colliders are the profile's: a segment's distance never exceeds the
 * least distance of points sampled along it, nor falls below that least
 * less half the sampling step (a signed distance moves no faster than the
 * point); the stance stands on the floor within the skin's 10 mm; lifting
 * the root lifts the lowest point and every placed segment by as much.
 *
 * Scenarios, per body of `motionHumanBody.EXTREMES` and arm:
 * 1. `trunk` is the placed hips, spine, chest, upper chest, neck and head;
 *    `obstacles` adds both thighs, and the upper arm, forearm and hand of
 *    each arm named as already placed; all are `placed`'s own entries.
 * 2. A forearm held straight out sideways lacks nothing.
 * 3. The median plane: an elbow 50 mm across lacks `r + 0.05` metres; an
 *    elbow nearer the plane than a wrist sent across lacks nothing.
 * 4. A forearm through the chest from side to side lacks more than half
 *    `r`.
 * 5. The palm laid on the chest lacks no more than the median plane's term
 *    against its own trunk; the deep forearm lacks more than `r / 8`
 *    against another body's chest.
 * 6. `room` of the stance's own arm is the overshoot of the stance's
 *    displayed forearm against the trunk, the thighs and the other arm;
 *    `room` of an arm raised sideways is 0; `posed` writes an arm's three
 *    joints and keeps every other joint.
 * 7. `cleared` keeps an arm within its allowance as it is; for each arm
 *    that lacks more than a degree, it changes only the two documented
 *    angles, keeps the range and the hand, never worsens the overshoot, and
 *    clears it wherever a turn within reach does; against a partner close
 *    ahead the same holds for an arm raised into them.
 * 8. `HumanColliders`: `distance` is the zero-length `distanceToSegment`; a
 *    point 1 m above the crown is at least 0.9 m off and the hips' frame
 *    lies inside; a segment's distance is bracketed by its samples; the
 *    stance's `lowest` point is within 10 mm of the floor; lifting the root
 *    by 0.25 m lifts `lowest` and every `placed` position by 0.25 m and
 *    leaves every rotation.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places forearms against the displayed colliders of real bodies and calls each public function; a wrong unit, a lost median plane, a wrist excused against another body, a clearing that turns another joint, leaves its range or stops short, or a misplaced collider fails with its cell.
 * @evidence contracts/development/testing.md#independent-expectations Every expected value follows from the documented rule and the cell's geometry worked out in the comment; the reachability of a clearing is decided by a grid search the function does not do.
 * @evidence contracts/development/testing.md#distinguishing-cases Four bodies, both arms; a forearm clear, across the median plane, inside the chest, laid on it against its own and another body; arms within and beyond their allowance, against the trunk and a partner.
 * @evidence contracts/development/testing.md#execution-ownership In memory; named `test_human_` because the clearing's grid search runs many forward kinematic passes, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States the unit, both rules, the geometry of each placed forearm, the clearing's promise and the 8 scenarios with their bounds.
 */
export function test_human_motion_posture_arm_clearance(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
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
  for (const name of motionHumanBody.EXTREMES) {
    const body: IHumanBody = motionHumanBody(name);
    const posture: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
    const pose: IAutoMoviePose = resolveHumanPosture(body, posture);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
    );
    const placed: HumanColliders.IPlaced[] = HumanColliders.placed(body, bones);
    const r: number = body.measure.forearmRadius;
    const degrees = (metres: number): number =>
      ((metres / body.measure.upperArm) * 180) / Math.PI;

    // 1. The trunk and the obstacles.
    const trunk: HumanColliders.IPlaced[] = HumanArmClearance.trunk(
      body,
      bones,
    );
    const obstacles: HumanColliders.IPlaced[] = HumanArmClearance.obstacles(
      body,
      bones,
    );
    complaints.equals(
      `${name}: trunk`,
      trunk,
      placed.filter((s) => TRUNK.includes(s.bone)),
    );
    complaints.equals(
      `${name}: obstacles`,
      obstacles,
      placed.filter(
        (s) =>
          TRUNK.includes(s.bone) ||
          s.bone === "leftUpperLeg" ||
          s.bone === "rightUpperLeg",
      ),
    );
    complaints.equals(
      `${name}: obstacles with the left arm placed`,
      HumanArmClearance.obstacles(body, bones, ["left"]),
      placed.filter(
        (s) =>
          TRUNK.includes(s.bone) ||
          s.bone === "leftUpperLeg" ||
          s.bone === "rightUpperLeg" ||
          s.bone === "leftUpperArm" ||
          s.bone === "leftLowerArm" ||
          s.bone === "leftHand",
      ),
    );
    complaints.check(
      `${name}: the trunk has its chest and hips`,
      trunk.some((s) => s.bone === "hips") &&
        trunk.some((s) => s.bone === "chest" || s.bone === "upperChest"),
    );

    const chest: HumanColliders.IPlaced = (trunk.find(
      (s) => s.bone === "upperChest",
    ) ?? trunk.find((s) => s.bone === "chest"))!;
    const toward = (
      from: IAutoMovieVector3,
      x: number,
      y: number,
      z: number,
    ): IAutoMovieVector3 => ({ x: from.x + x, y: from.y + y, z: from.z + z });
    for (const side of ["left", "right"] as const) {
      const sign: number = side === "left" ? 1 : -1;
      const cell: string = `${name} ${side}`;
      const shoulder: IAutoMovieVector3 = bones.get(
        `${side}UpperArm`,
      )!.worldPosition;

      // 2. Straight out sideways.
      const elbowOut: IAutoMovieVector3 = toward(
        shoulder,
        sign * body.measure.upperArm,
        0,
        0,
      );
      const sideways: number = HumanArmClearance.overshoot(
        body,
        obstacles,
        elbowOut,
        toward(elbowOut, sign * 0.25, 0, 0),
        side,
      );
      complaints.check(
        `${cell}: a forearm held out sideways lacks ${sideways.toFixed(4)} deg`,
        sideways === 0,
      );

      // 3. The median plane, far ahead of every collider.
      const ahead: IAutoMovieVector3 = toward(chest.pose.position, 0, 0, 0.8);
      const across: number = HumanArmClearance.overshoot(
        body,
        obstacles,
        toward(ahead, -sign * 0.05, 0, 0),
        toward(ahead, sign * 0.25, 0, 0),
        side,
      );
      complaints.check(
        `${cell}: an elbow 50 mm across the median plane lacks ${across.toFixed(4)} deg, expected ${degrees(r + 0.05).toFixed(4)}`,
        Math.abs(across - degrees(r + 0.05)) <= 1e-3,
      );
      const sent: number = HumanArmClearance.overshoot(
        body,
        obstacles,
        toward(ahead, -sign * 0.02, 0, 0),
        toward(ahead, -sign * 0.1, 0, 0),
        side,
      );
      complaints.check(
        `${cell}: an elbow following a wrist sent across lacks ${sent.toFixed(4)} deg`,
        sent === 0,
      );

      // 4. Through the chest from side to side.
      const through: number = HumanArmClearance.overshoot(
        body,
        obstacles,
        toward(chest.pose.position, sign * 0.4, 0, 0),
        toward(chest.pose.position, -sign * 0.4, 0, 0),
        side,
      );
      complaints.check(
        `${cell}: a forearm through the chest lacks ${through.toFixed(3)} deg, at least ${degrees(r / 2).toFixed(3)} expected`,
        through > degrees(r / 2),
      );

      // 5. A palm laid on the chest, against its own trunk and another body.
      const hit: HumanColliders.IHit | undefined = HumanColliders.cast(
        body,
        new Map([...bones].filter(([bone]) => bone === chest.bone)),
        toward(chest.pose.position, sign * 0.02, 0, 0.6),
        { x: 0, y: 0, z: -1 },
        1,
      );
      if (hit === undefined)
        complaints.check(`${cell}: the chest is hit`, false);
      else {
        const forearm = (
          depth: number,
          length: number,
        ): [IAutoMovieVector3, IAutoMovieVector3] => {
          const wrist: IAutoMovieVector3 = toward(
            hit.point,
            -hit.normal.x * depth,
            -hit.normal.y * depth,
            -hit.normal.z * depth,
          );
          return [
            toward(
              wrist,
              hit.normal.x * length,
              hit.normal.y * length,
              hit.normal.z * length,
            ),
            wrist,
          ];
        };
        const [elbow, wrist] = forearm(0.01, 0.4);
        const out: IAutoMovieVector3 = Quaternion.rotateVector(
          chest.pose.rotation,
          { x: sign, y: 0, z: 0 },
        );
        const own = (p: IAutoMovieVector3): number =>
          (p.x - chest.pose.position.x) * out.x +
          (p.y - chest.pose.position.y) * out.y +
          (p.z - chest.pose.position.z) * out.z;
        const plane: number = degrees(
          Math.max(0, Math.min(r, own(wrist)) - own(elbow)),
        );
        const laid: number = HumanArmClearance.overshoot(
          body,
          trunk,
          elbow,
          wrist,
          side,
        );
        complaints.check(
          `${cell}: a palm laid 10 mm into the own chest lacks ${laid.toFixed(4)} deg, the median plane's ${plane.toFixed(4)}`,
          Math.abs(laid - plane) <= 1e-6,
        );
        const [deepElbow, deepWrist] = forearm(0.06, 0.25);
        const foreign: number = HumanArmClearance.overshoot(
          body,
          [],
          deepElbow,
          deepWrist,
          side,
          [chest],
        );
        complaints.check(
          `${cell}: a forearm 60 mm into another body's chest lacks ${foreign.toFixed(4)} deg, more than ${degrees(r / 8).toFixed(4)} expected`,
          foreign > degrees(r / 8),
        );
      }

      // 6. Room.
      const own: HumanArmClearance.IArm = {
        upper: triple(pose, `${side}UpperArm`),
        lower: triple(pose, `${side}LowerArm`),
        hand: triple(pose, `${side}Hand`),
      };
      const other: "left" | "right" = side === "left" ? "right" : "left";
      const stance: number = HumanArmClearance.overshoot(
        body,
        placed.filter(
          (s) =>
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
      complaints.check(
        `${cell}: the stance's room ${HumanArmClearance.room(body, pose, side, own).toFixed(6)} is its displayed overshoot against the trunk, the thighs and the other arm ${stance.toFixed(6)}`,
        Math.abs(HumanArmClearance.room(body, pose, side, own) - stance) <=
          1e-9,
      );
      const bent: HumanArmClearance.IArm = {
        upper: [20, 10, 5],
        lower: [60, 0, 0],
        hand: [10, 5, 0],
      };
      const posed: IAutoMoviePose = HumanArmClearance.posed(pose, side, bent);
      complaints.check(
        `${cell}: posed writes the arm's three joints and keeps every other`,
        posed.joints.length === pose.joints.length &&
          posed.joints.every((j: IAutoMovieJointPose, i: number): boolean => {
            const part: "upper" | "lower" | "hand" | undefined =
              j.bone === `${side}UpperArm`
                ? "upper"
                : j.bone === `${side}LowerArm`
                  ? "lower"
                  : j.bone === `${side}Hand`
                    ? "hand"
                    : undefined;
            return part === undefined
              ? JSON.stringify(j) === JSON.stringify(pose.joints[i])
              : j.flexion === bent[part][0] &&
                  j.abduction === bent[part][1] &&
                  j.twist === bent[part][2];
          }),
      );
      const raised: number = HumanArmClearance.room(body, pose, side, {
        upper: [0, 90, 0],
        lower: [0, 0, 0],
        hand: [0, 0, 0],
      });
      complaints.check(
        `${cell}: an arm raised sideways lacks ${raised.toFixed(4)} deg`,
        raised === 0,
      );

      // 7. Clearing.
      complaints.equals(
        `${cell}: an arm within its allowance is kept`,
        HumanArmClearance.cleared(body, pose, side, own, stance + 1),
        own,
      );
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

    // 8. The colliders.
    const crown: IAutoMovieVector3 = toward(
      bones.get("head")!.worldPosition,
      0,
      1.3,
      0,
    );
    complaints.check(
      `${name}: distance is the zero-length segment's`,
      HumanColliders.distance(body, bones, crown).distance ===
        HumanColliders.distanceToSegment(body, bones, crown, crown).distance,
    );
    complaints.check(
      `${name}: a point a metre above the crown is ${HumanColliders.distance(body, bones, crown).distance.toFixed(3)} m off`,
      HumanColliders.distance(body, bones, crown).distance >= 0.9,
    );
    const hips: HumanColliders.IPlaced = placed.find((s) => s.bone === "hips")!;
    complaints.check(
      `${name}: the hips' frame lies inside`,
      HumanColliders.distance(body, bones, hips.pose.position).distance < 0,
    );
    const a: IAutoMovieVector3 = toward(hips.pose.position, 0.5, 0.1, 0.3);
    const b: IAutoMovieVector3 = toward(hips.pose.position, -0.5, 0.3, 0.1);
    let least: number = Infinity;
    const SAMPLES: number = 40;
    for (let i: number = 0; i <= SAMPLES; i++) {
      const s: number = i / SAMPLES;
      least = Math.min(
        least,
        HumanColliders.distance(body, bones, {
          x: a.x + (b.x - a.x) * s,
          y: a.y + (b.y - a.y) * s,
          z: a.z + (b.z - a.z) * s,
        }).distance,
      );
    }
    const step: number = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / SAMPLES;
    const segment: number = HumanColliders.distanceToSegment(
      body,
      bones,
      a,
      b,
    ).distance;
    complaints.check(
      `${name}: a segment's distance ${segment.toFixed(4)} is bracketed by its samples' least ${least.toFixed(4)} and half a step ${(step / 2).toFixed(4)} under it`,
      segment <= least + 1e-9 && segment >= least - step / 2 - 1e-9,
    );
    const lowest: number = HumanColliders.lowest(body, bones);
    complaints.check(
      `${name}: the stance's lowest point is ${(lowest * 1000).toFixed(2)} mm off the floor`,
      Math.abs(lowest) <= 0.01,
    );
    const lifted: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(
        body,
        resolveHumanPosture(body, {
          ...posture,
          root: toward(posture.root, 0, 0.25, 0),
          limbs: {},
        }),
      );
    const flat: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, { ...posture, limbs: {} }),
    );
    complaints.check(
      `${name}: lifting the root lifts the lowest point by 0.25 m`,
      Math.abs(
        HumanColliders.lowest(body, lifted) -
          HumanColliders.lowest(body, flat) -
          0.25,
      ) <= 1e-9,
    );
    const up: HumanColliders.IPlaced[] = HumanColliders.placed(body, lifted);
    const down: HumanColliders.IPlaced[] = HumanColliders.placed(body, flat);
    complaints.check(
      `${name}: one placed segment per profile segment`,
      down.length === body.profile.segments.length && up.length === down.length,
    );
    complaints.check(
      `${name}: lifting the root lifts every placed segment and keeps its rotation`,
      up.every((s: HumanColliders.IPlaced, i: number): boolean => {
        const d: HumanColliders.IPlaced = down[i]!;
        return (
          Math.abs(s.pose.position.x - d.pose.position.x) <= 1e-9 &&
          Math.abs(s.pose.position.y - d.pose.position.y - 0.25) <= 1e-9 &&
          Math.abs(s.pose.position.z - d.pose.position.z) <= 1e-9 &&
          Math.abs(s.pose.rotation.x - d.pose.rotation.x) <= 1e-9 &&
          Math.abs(s.pose.rotation.y - d.pose.rotation.y) <= 1e-9 &&
          Math.abs(s.pose.rotation.z - d.pose.rotation.z) <= 1e-9 &&
          Math.abs(s.pose.rotation.w - d.pose.rotation.w) <= 1e-9
        );
      }),
    );
  }
  complaints.assert("every forearm is read and cleared as documented");
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
