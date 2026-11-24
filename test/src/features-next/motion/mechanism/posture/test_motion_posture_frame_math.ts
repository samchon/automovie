import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  HumanFoot,
  HumanFrame,
  hipJoints,
  humanRig,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";

import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * Scenarios: floor and joint frames, socket pivots, hip offsets, heading inversion,
 * reach slack, planted correction and attached goal ordering.
 * The frames every posture is written in: a performer's floor frame
 * (`HumanFrame`), the rigid foot rocker (`HumanFoot`), the hip joints under
 * a root (`hipJoints`) and the rig poses are read through (`humanRig`), on
 * the average man.
 *
 * A heading of 0 faces world +Z with the performer's left along world +X; a
 * heading of 90 faces +X with the left along -Z (the documented right-handed
 * turn about +Y). A foot pivoting about a sole point keeps that point where
 * it was put, whatever the heading and the pitch, because the rocker is a
 * rotation of the rigid foot about it (Perry and Burnfield). The hip joints
 * depend only on the root, its rotation and the pelvis joint, so they are
 * where a fully resolved stance displays its thighs' roots.
 *
 * Scenarios:
 * 1. `HumanFrame.point` puts a local left, up and forward at the stated
 *    world axes for headings 0 and 90, `local` inverts it for any heading,
 *    and `turn(90)` carries +Z to +X.
 * 2. `HumanFoot.offset` is the socket's own point for a socket on the foot
 *    and the toes' joint for `mtp`; a toe socket on the toes bone keeps its
 *    distance from the toes' joint as the toes flex and rises as they lift.
 * 3. `HumanFoot.pivot` keeps its heel, ball or toe on the given point for
 *    headings 0 and 90 and pitches -20, 0 and 30, with the documented
 *    rotation.
 * 4. On the displayed stance, `HumanFoot.sockets` lists heel, ball and toe in
 *    that order, from back to front, each within 10 mm of the floor.
 * 5. `hipJoints` at the stance's root, root rotation and pelvis are the
 *    stance's displayed hip joints within a micrometre, and a root moved by
 *    a vector moves both by it.
 * 6. `humanRig` is the body's skeleton with the engine's canonical joint
 *    axes and rest frames.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls each function on a real body and its displayed stance; a turned axis, a pivot that slides, a socket on the wrong bone, hips that ignore the root or a foreign rig fails.
 * @evidence contracts/development/testing.md#independent-expectations Axes are the documented heading convention, the pivot's fixed point is its definition, and the hips and sockets are read off the engine's forward kinematics of the stance.
 * @evidence contracts/development/testing.md#distinguishing-cases Two headings, three sole points and three pitches, both feet, a moved root.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the conventions and the 6 scenarios with their bounds.
 */
export function test_motion_posture_frame_math(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  checkElasticReach(complaints);
  checkResolver(complaints);
  // 1. The floor frame.
  const origin: IAutoMovieVector3 = { x: 1, y: 0.5, z: 2 };
  const at = (yaw: number, x: number, y: number, z: number) =>
    HumanFrame.point({ origin, yaw }, { x, y, z });
  complaints.check(
    "heading 0: left is +X, up is +Y, forward is +Z",
    near(at(0, 1, 0, 0), { x: 2, y: 0.5, z: 2 }) &&
      near(at(0, 0, 1, 0), { x: 1, y: 1.5, z: 2 }) &&
      near(at(0, 0, 0, 1), { x: 1, y: 0.5, z: 3 }),
  );
  complaints.check(
    "heading 90: left is -Z and forward is +X",
    near(at(90, 1, 0, 0), { x: 1, y: 0.5, z: 1 }) &&
      near(at(90, 0, 0, 1), { x: 2, y: 0.5, z: 2 }),
  );
  for (const yaw of [47]) {
    const local: IAutoMovieVector3 = { x: 0.3, y: -0.2, z: 1.1 };
    complaints.check(
      `local inverts point at heading ${yaw}`,
      near(
        HumanFrame.local({ origin, yaw }, at(yaw, local.x, local.y, local.z)),
        local,
      ),
    );
  }
  complaints.check(
    "turn(90) carries +Z to +X and turn(0) is the identity",
    near(Quaternion.rotateVector(HumanFrame.turn(90), { x: 0, y: 0, z: 1 }), {
      x: 1,
      y: 0,
      z: 0,
    }) &&
      near(
        Quaternion.rotateVector(HumanFrame.turn(0), { x: 0.2, y: 0.3, z: 0.4 }),
        { x: 0.2, y: 0.3, z: 0.4 },
      ),
  );

  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  for (const side of ["left", "right"] as const) {
    const suffix: "Left" | "Right" = side === "left" ? "Left" : "Right";
    // 2. Offsets.
    const foot: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
    const toesJoint: IAutoMovieVector3 = body.rest.get(`${side}Toes`)!;
    complaints.check(
      `${side}: mtp is the toes' joint from the ankle`,
      near(HumanFoot.offset(body, side, "mtp"), {
        x: toesJoint.x - foot.x,
        y: toesJoint.y - foot.y,
        z: toesJoint.z - foot.z,
      }),
    );
    for (const socket of ["heel", "ball", "toe"] as const) {
      const frame = body.surfaces.sockets[`${socket}${suffix}`];
      if (frame.bone === `${side}Foot`) {
        complaints.check(
          `${side} ${socket}: a socket on the foot is its own point`,
          near(HumanFoot.offset(body, side, socket), frame.point) &&
            near(HumanFoot.offset(body, side, socket, 40), frame.point),
        );
        continue;
      }
      const joint: IAutoMovieVector3 = body.rest.get(frame.bone)!;
      const pivotAt: IAutoMovieVector3 = {
        x: joint.x - foot.x,
        y: joint.y - foot.y,
        z: joint.z - foot.z,
      };
      const flat: IAutoMovieVector3 = HumanFoot.offset(body, side, socket, 0);
      const lifted: IAutoMovieVector3 = HumanFoot.offset(
        body,
        side,
        socket,
        30,
      );
      const radius = (p: IAutoMovieVector3): number =>
        Math.hypot(p.x - pivotAt.x, p.y - pivotAt.y, p.z - pivotAt.z);
      complaints.check(
        `${side} ${socket}: a socket on the toes keeps its distance from their joint and rises as they lift (${flat.y.toFixed(4)} to ${lifted.y.toFixed(4)})`,
        Math.abs(radius(flat) - radius(lifted)) <= 1e-9 && lifted.y > flat.y,
      );
    }

    // 3. Pivots.
    const fixed: IAutoMovieVector3 = { x: 0.4, y: 0, z: -0.3 };
    for (const [point, heading, pitch] of [
      ["heel", 90, -20],
      ["ball", 0, 30],
      ["toe", 90, 30],
    ] as const) {
      const placed: IAutoMovieMotionHumanFoot.IPlacement = HumanFoot.pivot(
        body,
        side,
        point,
        fixed,
        heading,
        pitch,
      );
      complaints.check(
        `${side} pivot on the ${point} at heading ${heading}, pitch ${pitch} keeps it in place`,
        near(HumanFoot.point(body, side, point, placed), fixed, 1e-9) &&
          near(
            Quaternion.rotateVector(placed.rotation, { x: 0, y: 0, z: 1 }),
            Quaternion.rotateVector(HumanFoot.rotation(heading, pitch), {
              x: 0,
              y: 0,
              z: 1,
            }),
          ),
      );
    }
  }

  // 4. Sockets on the displayed stance.
  const pose: IAutoMoviePose = resolveHumanPosture(
    body,
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
  );
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    pose,
  );
  for (const side of ["left", "right"] as const) {
    const sockets: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
      body,
      bones,
      side,
    );
    complaints.equals(
      `${side}: the sockets in order`,
      sockets.map((s) => s.socket),
      ["heel", "ball", "toe"],
    );
    complaints.check(
      `${side}: heel, ball and toe run back to front (${sockets.map((s) => s.point.z.toFixed(3)).join(", ")})`,
      sockets[0]!.point.z < sockets[1]!.point.z &&
        sockets[1]!.point.z < sockets[2]!.point.z,
    );
    complaints.check(
      `${side}: every socket is on the floor (${sockets.map((s) => (s.point.y * 1000).toFixed(1)).join(", ")} mm)`,
      sockets.every((s) => Math.abs(s.point.y) <= 0.01),
    );
  }

  // 5. The hip joints.
  const pelvis: IAutoMovieJointPose | undefined = pose.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === "hips",
  );
  const triple: readonly [number, number, number] | undefined =
    pelvis === undefined
      ? undefined
      : [pelvis.flexion ?? 0, pelvis.abduction ?? 0, pelvis.twist ?? 0];
  const root = pose.root!;
  const hips = hipJoints(body, root.translation, root.rotation, triple);
  complaints.check(
    "the hip joints are the stance's",
    near(hips.left, bones.get("leftUpperLeg")!.worldPosition, 1e-6) &&
      near(hips.right, bones.get("rightUpperLeg")!.worldPosition, 1e-6),
  );
  const moved = hipJoints(
    body,
    {
      x: root.translation.x + 0.7,
      y: root.translation.y - 0.2,
      z: root.translation.z + 1.5,
    },
    root.rotation,
    triple,
  );
  complaints.check(
    "a moved root moves both hips by as much",
    near(
      moved.left,
      { x: hips.left.x + 0.7, y: hips.left.y - 0.2, z: hips.left.z + 1.5 },
      1e-9,
    ) &&
      near(
        moved.right,
        {
          x: hips.right.x + 0.7,
          y: hips.right.y - 0.2,
          z: hips.right.z + 1.5,
        },
        1e-9,
      ),
  );

  // 6. The rig.
  const rig = humanRig(body);
  complaints.check(
    "the rig is the body's skeleton with the canonical tables",
    rig.skeleton === body.skeleton &&
      rig.jointAxes === HUMANOID_JOINT_AXES &&
      rig.restFrames === HUMANOID_REST_FRAME,
  );
  complaints.assert("every frame reads as documented");
}

const near = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  e: number = 1e-9,
): boolean =>
  Math.abs(a.x - b.x) <= e &&
  Math.abs(a.y - b.y) <= e &&
  Math.abs(a.z - b.z) <= e;

function checkResolver(complaints: motionComplaints.IGatherer): void {
  const rad = (d: number): number => (d * Math.PI) / 180;

  // 1. Heading and angles.
  for (const [yaw, pitch, roll] of [
    [0, 0, 0],
    [-170, 80, -40],
    [45, -60, 25],
  ] as const) {
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
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
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
  const quiet: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const free: IAutoMovieMotionHumanPosture = { ...quiet, limbs: {} };
  complaints.check(
    "a posture with no planted leg is kept",
    resolveHumanPosture.lower(body, free) === free,
  );
  const sunk: IAutoMovieMotionHumanPosture = {
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
  const lowered: IAutoMovieMotionHumanPosture = resolveHumanPosture.lower(
    body,
    sunk,
  );
  const hips = hipJoints(
    body,
    lowered.root,
    resolveHumanPosture.heading(lowered),
    lowered.joints.hips,
  );
  for (const side of ["left", "right"] as const) {
    const goal: IAutoMovieHumanLimbGoal | undefined = sunk.limbs[`${side}Leg`];
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
  const at: IAutoMovieHumanLimbGoal = {
    point: { x: 0, y: 0, z: 0 },
    bend: { x: 0, y: 0, z: 1 },
  };
  complaints.equals(
    "legs then arms",
    resolveHumanPosture.order({ rightArm: at, leftLeg: at }),
    ["leftLeg", "rightLeg", "leftArm", "rightArm"],
  );
  const order: AutoMovieHumanLimb[] = resolveHumanPosture.order({
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
  const carried: IAutoMovieHumanLimbGoal = resolveHumanPosture.world(
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
}

/** Reconstruct the knee from the hip and ankle triangle across full extension. */
function checkElasticReach(complaints: motionComplaints.IGatherer): void {
  const body = motionHumanBody("m-average");
  const a = body.measure.thigh,
    b = body.measure.shank;
  const knee = resolveHumanPosture.KNEE;
  const reach = Math.sqrt(
    a * a + b * b + 2 * a * b * Math.cos((knee * Math.PI) / 180),
  );
  const ankle: IAutoMovieVector3 = { x: 0, y: 0, z: 0.1 };
  const limit = Math.sqrt(reach * reach - ankle.z * ankle.z);
  // 0.12 m/s at 30 Hz, the campaign's vertical walking pace.
  const step = 0.12 / 30;
  const slack = (v: number, stride?: number) =>
    resolveHumanPosture.short(body, { x: 0, y: v, z: 0 }, ankle, knee, stride);
  const maxJump = (stride?: number): number => {
    let previous: IAutoMovieVector3 | undefined,
      largest = 0;
    for (let v = limit - 0.1; v <= limit + 0.1; v += step) {
      const y = v - Math.max(0, slack(v, stride));
      const d = Math.hypot(ankle.z, y),
        along = (a * a - b * b + d * d) / (2 * d);
      const off = Math.sqrt(Math.max(0, a * a - along * along));
      const point: IAutoMovieVector3 = {
        x: 0,
        y: y - (along * y) / d + (off * ankle.z) / d,
        z: (along * ankle.z) / d + (off * y) / d,
      };
      if (previous)
        largest = Math.max(
          largest,
          Math.hypot(point.y - previous.y, point.z - previous.z),
        );
      previous = point;
    }
    return largest;
  };
  complaints.check(
    "frame-aware reach holds the knee within its 5 mm step",
    maxJump(step) <= 0.005 + 1e-9,
  );
  complaints.check(
    "hard reach exceeds the same knee displacement",
    maxJump() > 0.005,
  );
  complaints.check(
    "hip below the band has slack",
    slack(limit - 0.3, step) < 0,
  );
}
