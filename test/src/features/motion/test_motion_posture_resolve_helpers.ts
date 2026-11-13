import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  type IHumanBody,
  type IHumanPosture,
  hipJoints,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The helpers a posture is resolved with (`resolveHumanPosture.*`), on the
 * average man in the quiet stance.
 *
 * The heading is documented as `R = Ry(yaw) Rx(pitch) Rz(roll)`, whose
 * turned forward axis is `(sin yaw cos pitch, -sin pitch, cos yaw cos
 * pitch)`; `angles` inverts it away from a pitch of 90 degrees. A leg of
 * thigh `a` and shank `b` bent by `k` degrees spans `sqrt(a^2 + b^2 + 2ab cos
 * k)` from hip to ankle (the law of cosines on the knee's interior angle
 * `180 - k`), so `short` is the height the hip stands above the point at
 * that span over the ankle, and `lower` drops the root until no planted leg
 * is short.
 *
 * Scenarios:
 * 1. `heading` turns +Z to the documented forward axis, and `angles` gives
 *    back every yaw, pitch and roll of a grid away from vertical.
 * 2. `short` is 0 for a hip exactly a bent leg's span above the ankle, the
 *    span's excess for a higher hip, negative for a lower one and
 *    `-Infinity` for an ankle horizontally beyond the span.
 * 3. `lower` keeps a posture with no planted leg as it is, and lowers a
 *    stance whose planted feet are pushed 0.1 m down until no leg is short.
 * 4. `limb` puts the right wrist on a goal ahead within a millimetre and
 *    leaves every joint off the right arm's chain as it was.
 * 5. `reference` reads a limb's upper and lower bones' triples, zero where
 *    the pose has none.
 * 6. `order` fits legs then arms, puts a limb after the limb its goal is
 *    attached to and refuses two limbs attached to each other.
 * 7. `world` returns an unattached goal as it is, carries an attached one by
 *    the bone's displayed frame (`P + R p`, `R q`), and refuses a bone of
 *    the limb's own chain and a bone the rig lacks.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls each helper on a real body and its displayed stance; a swapped rotation order, a wrong leg span, a lowering that leaves a leg short, a fit that moves another joint, a wrong fitting order or a goal carried in the wrong frame fails.
 * @evidence contracts/development/testing.md#independent-expectations The forward axis and the span are the documented formulas worked out per case; the carried goal is computed from the displayed bone's frame.
 * @evidence contracts/development/testing.md#distinguishing-cases A grid of headings, a hip at, above and below the span and beyond it, postures with and without plants, attached and free goals, a cycle and two bad bones.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the conventions, the span and the 7 scenarios with their bounds.
 */
export function test_motion_posture_resolve_helpers(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const near = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    e: number = 1e-9,
  ): boolean =>
    Math.abs(a.x - b.x) <= e &&
    Math.abs(a.y - b.y) <= e &&
    Math.abs(a.z - b.z) <= e;
  const rad = (d: number): number => (d * Math.PI) / 180;

  // 1. Heading and angles.
  for (const yaw of [-170, -30, 0, 45, 170])
    for (const pitch of [-60, 0, 30, 80])
      for (const roll of [-40, 0, 25]) {
        const q: IAutoMovieQuaternion = resolveHumanPosture.heading({
          yaw,
          pitch,
          roll,
        });
        complaints.check(
          `heading ${yaw}, ${pitch}, ${roll} turns +Z to the documented forward`,
          near(Quaternion.rotateVector(q, { x: 0, y: 0, z: 1 }), {
            x: Math.sin(rad(yaw)) * Math.cos(rad(pitch)),
            y: -Math.sin(rad(pitch)),
            z: Math.cos(rad(yaw)) * Math.cos(rad(pitch)),
          }),
        );
        const back = resolveHumanPosture.angles(q);
        complaints.check(
          `angles gives back ${yaw}, ${pitch}, ${roll}: ${back.yaw.toFixed(6)}, ${back.pitch.toFixed(6)}, ${back.roll.toFixed(6)}`,
          Math.abs(back.yaw - yaw) <= 1e-6 &&
            Math.abs(back.pitch - pitch) <= 1e-6 &&
            Math.abs(back.roll - roll) <= 1e-6,
        );
      }

  // 2. Short.
  const body: IHumanBody = motionHumanBody("m-average");
  const a: number = body.measure.thigh;
  const b: number = body.measure.shank;
  const knee: number = 20;
  // The ankle of a leg hanging from the origin with its knee bent by `knee`
  // in the sagittal plane: the thigh straight down, the shank turned back.
  const span: number = Math.hypot(
    b * Math.sin(rad(knee)),
    a + b * Math.cos(rad(knee)),
  );
  const ankle: IAutoMovieVector3 = { x: 0.1, y: 0.08, z: 0.05 };
  const across: number = 0.2;
  const height: number = Math.sqrt(span * span - across * across);
  const hipAt = (above: number): IAutoMovieVector3 => ({
    x: ankle.x + across,
    y: ankle.y + height + above,
    z: ankle.z,
  });
  complaints.check(
    "a hip a bent leg's span from the ankle is not short",
    Math.abs(resolveHumanPosture.short(body, hipAt(0), ankle, knee)) <= 1e-9,
  );
  complaints.check(
    "a higher hip is short by its excess",
    Math.abs(
      resolveHumanPosture.short(body, hipAt(0.07), ankle, knee) - 0.07,
    ) <= 1e-9,
  );
  complaints.check(
    "a lower hip has slack",
    Math.abs(
      resolveHumanPosture.short(body, hipAt(-0.05), ankle, knee) + 0.05,
    ) <= 1e-9,
  );
  complaints.check(
    "an ankle beyond the span cannot be helped",
    resolveHumanPosture.short(
      body,
      { x: ankle.x + span + 0.01, y: ankle.y, z: ankle.z },
      ankle,
      knee,
    ) === -Infinity,
  );

  // 3. Lower.
  const quiet: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const free: IHumanPosture = { ...quiet, limbs: {} };
  complaints.check(
    "a posture with no planted leg is kept",
    resolveHumanPosture.lower(body, free) === free,
  );
  const sunk: IHumanPosture = {
    ...quiet,
    limbs: Object.fromEntries(
      Object.entries(quiet.limbs).map(([limb, goal]) => [
        limb,
        limb.endsWith("Leg")
          ? {
              ...goal!,
              planted: true,
              point: { ...goal!.point, y: goal!.point.y - 0.1 },
            }
          : goal,
      ]),
    ),
  };
  const lowered: IHumanPosture = resolveHumanPosture.lower(body, sunk);
  const hips = hipJoints(
    body,
    lowered.root,
    resolveHumanPosture.heading(lowered),
    lowered.joints.hips,
  );
  for (const side of ["left", "right"] as const) {
    const goal: IHumanPosture.IGoal | undefined = sunk.limbs[`${side}Leg`];
    if (goal === undefined) continue;
    const left: number = resolveHumanPosture.short(
      body,
      hips[side],
      goal.point,
      5,
    );
    complaints.check(
      `a lowered ${side} leg is short by ${left.toFixed(6)} m`,
      left <= 1e-9,
    );
  }
  complaints.check(
    "a stance on sunk plants is lowered",
    lowered.root.y < quiet.root.y,
  );

  // 4. Limb.
  const pose: IAutoMoviePose = resolveHumanPosture(body, quiet);
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    pose,
  );
  const shoulder: IAutoMovieVector3 = bones.get("rightUpperArm")!.worldPosition;
  const goal: IAutoMovieVector3 = {
    x: shoulder.x,
    y: shoulder.y - 0.1,
    z: shoulder.z + 0.4,
  };
  const fitted: IAutoMoviePose = resolveHumanPosture.limb(
    body,
    pose,
    "rightArm",
    {
      point: goal,
      bend: { x: shoulder.x - 0.3, y: shoulder.y - 0.3, z: shoulder.z },
    },
  );
  const wrist: IAutoMovieVector3 = poseBones(body, fitted).get(
    "rightHand",
  )!.worldPosition;
  complaints.check(
    `the fitted wrist is ${(Math.hypot(wrist.x - goal.x, wrist.y - goal.y, wrist.z - goal.z) * 1000).toFixed(3)} mm off its goal`,
    near(wrist, goal, 1e-3),
  );
  const chain: string[] = ["rightUpperArm", "rightLowerArm", "rightHand"];
  const moved: string[] = fitted.joints
    .filter((j: IAutoMovieJointPose): boolean => !chain.includes(j.bone))
    .filter(
      (j: IAutoMovieJointPose): boolean =>
        JSON.stringify(j) !==
        JSON.stringify(pose.joints.find((k) => k.bone === j.bone)),
    )
    .map((j: IAutoMovieJointPose): string => j.bone);
  complaints.equals("a limb fit moves only its chain", moved, []);

  // 5. Reference.
  const triple = (bone: string): number[] => {
    const j = fitted.joints.find((k) => k.bone === bone);
    return [j?.flexion ?? 0, j?.abduction ?? 0, j?.twist ?? 0];
  };
  complaints.equals(
    "the right arm's reference",
    resolveHumanPosture.reference(fitted, "rightArm"),
    { upper: triple("rightUpperArm"), lower: triple("rightLowerArm") },
  );
  complaints.equals(
    "the left leg's reference",
    resolveHumanPosture.reference(fitted, "leftLeg"),
    { upper: triple("leftUpperLeg"), lower: triple("leftLowerLeg") },
  );
  complaints.equals(
    "a pose without the bones reads zero",
    resolveHumanPosture.reference({ ...fitted, joints: [] }, "rightLeg"),
    { upper: [0, 0, 0], lower: [0, 0, 0] },
  );

  // 6. Order.
  const at: IHumanPosture.IGoal = {
    point: { x: 0, y: 0, z: 0 },
    bend: { x: 0, y: 0, z: 1 },
  };
  complaints.equals(
    "legs then arms",
    resolveHumanPosture.order({ rightArm: at, leftLeg: at }),
    ["leftLeg", "rightLeg", "leftArm", "rightArm"],
  );
  const order: IHumanPosture.Limb[] = resolveHumanPosture.order({
    leftArm: { ...at, on: "rightLowerArm" },
    rightArm: at,
    leftLeg: { ...at, on: "leftHand" },
  });
  complaints.check(
    `a limb after the limb it is attached to: ${order.join(", ")}`,
    order.length === 4 &&
      order.indexOf("rightArm") < order.indexOf("leftArm") &&
      order.indexOf("leftArm") < order.indexOf("leftLeg"),
  );
  complaints.refuses("two limbs attached to each other", () =>
    resolveHumanPosture.order({
      leftArm: { ...at, on: "rightHand" },
      rightArm: { ...at, on: "leftLowerArm" },
    }),
  );

  // 7. World.
  complaints.check(
    "an unattached goal is kept",
    resolveHumanPosture.world(body, pose, "rightArm", at) === at,
  );
  const chest: IAutoMovieResolvedBone = bones.get("chest")!;
  const local: IAutoMovieVector3 = { x: 0.05, y: 0.1, z: 0.2 };
  const twist: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    30,
  );
  const carried: IHumanPosture.IGoal = resolveHumanPosture.world(
    body,
    pose,
    "rightArm",
    { point: local, bend: local, rotation: twist, on: "chest" },
  );
  const placed: IAutoMovieVector3 = (() => {
    const r: IAutoMovieVector3 = Quaternion.rotateVector(
      chest.worldRotation,
      local,
    );
    return {
      x: chest.worldPosition.x + r.x,
      y: chest.worldPosition.y + r.y,
      z: chest.worldPosition.z + r.z,
    };
  })();
  const turned: IAutoMovieQuaternion = Quaternion.multiply(
    chest.worldRotation,
    twist,
  );
  complaints.check(
    "an attached goal is carried by the bone's frame",
    near(carried.point, placed) &&
      near(carried.bend, placed) &&
      carried.on === undefined &&
      Math.abs(
        Math.abs(
          carried.rotation!.x * turned.x +
            carried.rotation!.y * turned.y +
            carried.rotation!.z * turned.z +
            carried.rotation!.w * turned.w,
        ) - 1,
      ) <= 1e-9,
  );
  complaints.refuses("a goal on its own chain", () =>
    resolveHumanPosture.world(body, pose, "rightArm", {
      ...at,
      on: "rightLowerArm",
    }),
  );
  complaints.refuses("a goal on a bone the rig lacks", () =>
    resolveHumanPosture.world(body, pose, "rightArm", {
      ...at,
      on: "noSuchBone" as string as AutoMovieHumanoidBone,
    }),
  );
  complaints.assert("every resolve helper reads as documented");
}
