import {
  DEFAULT_HUMANOID_ROM,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  fitChainToTarget,
  indexSkeletonTopology,
  resolvePose,
  rotationBetween,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Arm reaches that need the shoulder's whole range land on their targets
 * inside the default range of motion, bend the elbow toward its hint, mirror
 * exactly, and turn the hand by forearm twist plus wrist.
 *
 * The rig is a kinematic chain fixture: a trunk and two arms in the
 * canonical T-pose (upper arm 0.3 m, forearm 0.25 m, shoulders 0.18 m from
 * the midline at 1.5 m), read with HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME
 * and DEFAULT_HUMANOID_ROM, the conventions every humanoid consumer uses.
 *
 * Scenarios, each on the left arm:
 * 1. Behind the head, clasped behind the back, across the body to the other
 *    elbow, a hand on the hip and a plain forward reach: the wrist lands within
 *    1 mm, every arm angle lies inside its default range, the elbow's
 *    abduction is zero (a hinge) and the elbow lies on its hint's side of the
 *    shoulder-to-wrist line.
 * 2. Mirror: the right arm solving the mirrored goal and hint gives the same
 *    clinical angles within 1e-6 degrees and mirrored joint positions within
 *    1e-6 m.
 * 3. A palm-up and a vertical-palm hand forward reach the requested hand
 *    rotation within 2 degrees with the wrist still within 1 mm, the forearm's
 *    twist carrying the pronation or supination inside its range.
 *    Honesty: the vertical palm on a straight arm pointing 39.5 degrees down
 *    needs that much radial deviation; the hand misses by the excess over
 *    the wrist's 20 degree limit within 1 degree, and every arm angle stays
 *    in range.
 *    Palm up and palm down on both arms: each hand within 2 degrees of its
 *    request, and the right arm's solve of the mirrored request equal to the
 *    left's in clinical angles within 1e-6 degrees.
 * 4. A target 2 m away leaves the wrist on the line toward it at the arm's
 *    full length, within 1 mm: the residual is honest, not a pretended reach.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public fit and reads the result through forward kinematics; a missed reach, an out-of-range or abducted elbow, an elbow on the wrong side, an asymmetric solve, an unturned hand or a faked unreachable reach fails.
 * @evidence contracts/development/testing.md#independent-expectations Distances and rotations come from forward kinematics and the targets written here; ranges are read from DEFAULT_HUMANOID_ROM; the mirror relation is the rig's sagittal symmetry; the unreachable expectation is the straight arm's length along the target line.
 * @evidence contracts/development/testing.md#distinguishing-cases Shoulder extremes (overhead and external rotation, extension and internal rotation, cross-body adduction), a plain reach, both sides, supination and a neutral palm, and an unreachable target; leg chains are owned by the plant and walk tests.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory engine unit with no body or render; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_motion_fit_chain_reach(): void {
  const skeleton: IAutoMovieSkeleton = arms();
  const failures: string[] = [];
  const check = (label: string, ok: boolean): void => {
    if (!ok) failures.push(label);
  };
  const shoulder: IAutoMovieVector3 = { x: 0.18, y: 1.5, z: 0 };
  const goals: {
    name: string;
    target: IAutoMovieVector3;
    bend: IAutoMovieVector3;
  }[] = [
    {
      name: "behind the head",
      target: { x: 0.04, y: 1.72, z: -0.14 },
      bend: { x: 0.42, y: 1.68, z: 0.02 },
    },
    {
      name: "clasped behind",
      target: { x: 0.04, y: 1.08, z: -0.16 },
      bend: { x: 0.3, y: 1.25, z: -0.15 },
    },
    {
      name: "across the body",
      target: { x: -0.16, y: 1.28, z: 0.14 },
      bend: { x: 0.2, y: 1.5 - 0.285, z: 0.06 },
    },
    {
      name: "hand on the hip",
      target: { x: 0.2, y: 1.02, z: -0.02 },
      bend: { x: 0.45, y: 1.25, z: -0.1 },
    },
    {
      name: "forward",
      target: { x: 0.18, y: 1.2, z: 0.45 },
      bend: { x: 0.35, y: 1.25, z: 0.1 },
    },
  ];
  for (const goal of goals) {
    const left: IAutoMoviePose = fit(skeleton, "left", goal.target, goal.bend);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = fk(
      skeleton,
      left,
    );
    const miss: number = Vector3.length(
      Vector3.subtract(bones.get("leftHand")!.worldPosition, goal.target),
    );
    check(
      `${goal.name}: wrist misses ${(miss * 1000).toFixed(2)} mm`,
      miss <= 0.001,
    );
    for (const bone of ["leftUpperArm", "leftLowerArm"] as const)
      check(`${goal.name}: ${bone} in range`, inRange(joint(left, bone)));
    check(
      `${goal.name}: elbow is a hinge`,
      Math.abs(joint(left, "leftLowerArm").abduction ?? 0) < 1e-6,
    );
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(goal.target, shoulder),
    );
    const across = (p: IAutoMovieVector3): IAutoMovieVector3 => {
      const v: IAutoMovieVector3 = Vector3.subtract(p, shoulder);
      return Vector3.subtract(v, Vector3.scale(axis, Vector3.dot(v, axis)));
    };
    check(
      `${goal.name}: elbow on the hint's side`,
      Vector3.dot(
        across(bones.get("leftLowerArm")!.worldPosition),
        across(goal.bend),
      ) > 0,
    );

    // 2. Mirror.
    const mirror = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: -p.x,
      y: p.y,
      z: p.z,
    });
    const right: IAutoMoviePose = fit(
      skeleton,
      "right",
      mirror(goal.target),
      mirror(goal.bend),
    );
    const mirrored: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = fk(
      skeleton,
      right,
    );
    for (const [l, r] of [
      ["leftUpperArm", "rightUpperArm"],
      ["leftLowerArm", "rightLowerArm"],
    ] as const) {
      const a: IAutoMovieJointPose = joint(left, l);
      const b: IAutoMovieJointPose = joint(right, r);
      check(
        `${goal.name}: ${l} mirrors in angle`,
        [
          a.flexion! - b.flexion!,
          (a.abduction ?? 0) - (b.abduction ?? 0),
          (a.twist ?? 0) - (b.twist ?? 0),
        ].every((d: number): boolean => Math.abs(d) < 1e-6),
      );
    }
    for (const [l, r] of [
      ["leftLowerArm", "rightLowerArm"],
      ["leftHand", "rightHand"],
    ] as const)
      check(
        `${goal.name}: ${l} mirrors in place`,
        Vector3.length(
          Vector3.subtract(
            mirror(bones.get(l)!.worldPosition),
            mirrored.get(r)!.worldPosition,
          ),
        ) < 1e-6,
      );
  }

  // 3. Hand rotations by forearm twist and wrist.
  const turns: {
    name: string;
    target: IAutoMovieVector3;
    fingers: IAutoMovieVector3;
    palm: IAutoMovieVector3;
  }[] = [
    {
      name: "palm up",
      target: { x: 0.2, y: 1.15, z: 0.4 },
      fingers: { x: 0, y: 0, z: 1 },
      palm: { x: 0, y: 1, z: 0 },
    },
    {
      name: "vertical palm",
      target: { x: 0.16, y: 1.24, z: 0.4 },
      fingers: { x: 0, y: 0, z: 1 },
      palm: { x: -1, y: 0, z: 0 },
    },
  ];
  for (const turn of turns) {
    const rotation: IAutoMovieQuaternion = hand(turn.fingers, turn.palm);
    const pose: IAutoMoviePose = fit(
      skeleton,
      "left",
      turn.target,
      { x: 0.4, y: 1.2, z: 0.1 },
      rotation,
    );
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = fk(
      skeleton,
      pose,
    );
    const shown: IAutoMovieQuaternion = bones.get("leftHand")!.worldRotation;
    const dot: number = Math.min(
      1,
      Math.abs(
        shown.x * rotation.x +
          shown.y * rotation.y +
          shown.z * rotation.z +
          shown.w * rotation.w,
      ),
    );
    const error: number = (2 * Math.acos(dot) * 180) / Math.PI;
    const show = (j: IAutoMovieJointPose): string =>
      [j.flexion, j.abduction, j.twist]
        .map((v: number | null): string => (v ?? 0).toFixed(1))
        .join("/");
    check(
      `${turn.name}: hand turned within 2 degrees (${error.toFixed(2)}; upper ${show(joint(pose, "leftUpperArm"))}, forearm ${show(joint(pose, "leftLowerArm"))}, wrist ${show(joint(pose, "leftHand"))})`,
      error <= 2,
    );
    check(
      `${turn.name}: wrist stays`,
      Vector3.length(
        Vector3.subtract(bones.get("leftHand")!.worldPosition, turn.target),
      ) <= 0.001,
    );
    check(
      `${turn.name}: forearm in range`,
      inRange(joint(pose, "leftLowerArm")),
    );
  }

  // 3c. Palm up and palm down on both arms, mirrored: the right arm's solve
  // of the mirrored request equals the left's in clinical angles and turns
  // the right hand as close to its request.
  for (const [name, palm] of [
    ["palm up", { x: 0, y: 1, z: 0 }],
    ["palm down", { x: 0, y: -1, z: 0 }],
  ] as const) {
    const target: IAutoMovieVector3 = { x: 0.2, y: 1.15, z: 0.4 };
    const bend: IAutoMovieVector3 = { x: 0.4, y: 1.2, z: 0.1 };
    const mirror = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: -p.x,
      y: p.y,
      z: p.z,
    });
    const leftTurn: IAutoMovieQuaternion = hand({ x: 0, y: 0, z: 1 }, palm);
    const rightTurn: IAutoMovieQuaternion = hand(
      { x: 0, y: 0, z: 1 },
      palm,
      "right",
    );
    const left: IAutoMoviePose = fit(skeleton, "left", target, bend, leftTurn);
    const right: IAutoMoviePose = fit(
      skeleton,
      "right",
      mirror(target),
      mirror(bend),
      rightTurn,
    );
    const error = (
      pose: IAutoMoviePose,
      side: "left" | "right",
      want: IAutoMovieQuaternion,
    ): number => {
      const q: IAutoMovieQuaternion = fk(skeleton, pose).get(
        `${side}Hand`,
      )!.worldRotation;
      return (
        (2 *
          Math.acos(
            Math.min(
              1,
              Math.abs(
                q.x * want.x + q.y * want.y + q.z * want.z + q.w * want.w,
              ),
            ),
          ) *
          180) /
        Math.PI
      );
    };
    check(
      `${name}: both hands within 2 degrees (${error(left, "left", leftTurn).toFixed(2)}, ${error(right, "right", rightTurn).toFixed(2)})`,
      error(left, "left", leftTurn) <= 2 &&
        error(right, "right", rightTurn) <= 2,
    );
    for (const [l, r] of [
      ["leftUpperArm", "rightUpperArm"],
      ["leftLowerArm", "rightLowerArm"],
      ["leftHand", "rightHand"],
    ] as const) {
      const a: IAutoMovieJointPose = joint(left, l);
      const b: IAutoMovieJointPose = joint(right, r);
      check(
        `${name}: ${l} mirrors`,
        [
          (a.flexion ?? 0) - (b.flexion ?? 0),
          (a.abduction ?? 0) - (b.abduction ?? 0),
          (a.twist ?? 0) - (b.twist ?? 0),
        ].every((d: number): boolean => Math.abs(d) < 1e-6),
      );
    }
  }

  // 3b. Honesty: a vertical palm on a straight arm pointing 39.5 degrees down
  // needs that much radial deviation at the wrist, beyond its 20 degree
  // limit; the miss is the excess, and nothing leaves its range.
  const low: IAutoMovieVector3 = { x: 0.12, y: 1.15, z: 0.42 };
  const level: IAutoMovieQuaternion = hand(
    { x: 0, y: 0, z: 1 },
    { x: -1, y: 0, z: 0 },
  );
  const straight: IAutoMoviePose = fit(
    skeleton,
    "left",
    low,
    { x: 0.4, y: 1.2, z: 0.1 },
    level,
  );
  const tilt: number =
    (Math.asin(
      (shoulder.y - low.y) / Vector3.length(Vector3.subtract(low, shoulder)),
    ) *
      180) /
    Math.PI;
  const deviation: number = DEFAULT_HUMANOID_ROM.leftHand!.abduction!.max;
  const reachedTurn: IAutoMovieQuaternion = fk(skeleton, straight).get(
    "leftHand",
  )!.worldRotation;
  const missTurn: number =
    (2 *
      Math.acos(
        Math.min(
          1,
          Math.abs(
            reachedTurn.x * level.x +
              reachedTurn.y * level.y +
              reachedTurn.z * level.z +
              reachedTurn.w * level.w,
          ),
        ),
      ) *
      180) /
    Math.PI;
  check(
    `straight-arm vertical palm misses by the deviation beyond its limit (${missTurn.toFixed(2)} vs ${(tilt - deviation).toFixed(2)})`,
    Math.abs(missTurn - (tilt - deviation)) <= 1,
  );
  for (const bone of ["leftUpperArm", "leftLowerArm", "leftHand"] as const)
    check(
      `straight-arm vertical palm: ${bone} in range`,
      inRange(joint(straight, bone)),
    );

  // 4. Unreachable: the straight arm along the line to the target.
  const far: IAutoMovieVector3 = { x: 0.6, y: 1.9, z: 1.9 };
  const reached: IAutoMovieVector3 = fk(
    skeleton,
    fit(skeleton, "left", far, { x: 0.4, y: 1.2, z: 0 }),
  ).get("leftHand")!.worldPosition;
  const line: IAutoMovieVector3 = Vector3.add(
    shoulder,
    Vector3.scale(Vector3.normalize(Vector3.subtract(far, shoulder)), 0.55),
  );
  check(
    `unreachable: straight arm toward the target (${(Vector3.length(Vector3.subtract(reached, line)) * 1000).toFixed(2)} mm)`,
    Vector3.length(Vector3.subtract(reached, line)) <= 0.001,
  );
  TestValidator.predicate(
    failures.join("; ") || "all checks",
    failures.length === 0,
  );
}

/** A trunk with two T-posed arms. */
function arms(): IAutoMovieSkeleton {
  const bone = (
    name: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    x: number,
    y: number,
  ): IAutoMovieBone => ({
    bone: name,
    parent,
    rest: {
      translation: { x, y, z: 0 },
      rotation: Quaternion.identity(),
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
  });
  return {
    id: "arms",
    bones: [
      bone("hips", null, 0, 1),
      bone("spine", "hips", 0, 0.15),
      bone("chest", "spine", 0, 0.2),
      bone("leftUpperArm", "chest", 0.18, 0.15),
      bone("leftLowerArm", "leftUpperArm", 0.3, 0),
      bone("leftHand", "leftLowerArm", 0.25, 0),
      bone("rightUpperArm", "chest", -0.18, 0.15),
      bone("rightLowerArm", "rightUpperArm", -0.3, 0),
      bone("rightHand", "rightLowerArm", -0.25, 0),
    ],
  };
}

/** Fit one arm. */
function fit(
  skeleton: IAutoMovieSkeleton,
  side: "left" | "right",
  target: IAutoMovieVector3,
  bend: IAutoMovieVector3,
  effectorRotation?: IAutoMovieQuaternion,
): IAutoMoviePose {
  return fitChainToTarget({
    skeleton,
    pose: { skeleton: skeleton.id, root: null, joints: [] },
    chain: {
      upper: `${side}UpperArm`,
      lower: `${side}LowerArm`,
      effector: `${side}Hand`,
    },
    target,
    bend,
    ...(effectorRotation === undefined ? {} : { effectorRotation }),
    topology: indexSkeletonTopology(skeleton),
    jointAxes: HUMANOID_JOINT_AXES,
    restFrames: HUMANOID_REST_FRAME,
  });
}

/** World bones of a pose. */
function fk(
  skeleton: IAutoMovieSkeleton,
  pose: IAutoMoviePose,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  return new Map(
    resolvePose(pose, skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME).map(
      (
        r: IAutoMovieResolvedBone,
      ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
    ),
  );
}

/** A joint of a pose, at rest when absent. */
function joint(
  pose: IAutoMoviePose,
  bone: AutoMovieHumanoidBone,
): IAutoMovieJointPose {
  return (
    pose.joints.find((j: IAutoMovieJointPose): boolean => j.bone === bone) ?? {
      bone,
      flexion: 0,
      abduction: 0,
      twist: 0,
    }
  );
}

/** Whether a joint lies inside its default range, 1e-6 degrees allowed for rounding. */
function inRange(j: IAutoMovieJointPose): boolean {
  const c = DEFAULT_HUMANOID_ROM[j.bone]!;
  const within = (
    v: number | null,
    r: { min: number; max: number } | null,
  ): boolean =>
    r === null
      ? Math.abs(v ?? 0) < 1e-6
      : (v ?? 0) >= r.min - 1e-6 && (v ?? 0) <= r.max + 1e-6;
  return (
    within(j.flexion, c.flexion) &&
    within(j.abduction, c.abduction) &&
    within(j.twist, c.twist)
  );
}

/** A hand's world rotation from rest for where its fingers point and its palm faces (rest: left fingers +X, right fingers -X, palms -Y). */
function hand(
  fingers: IAutoMovieVector3,
  palm: IAutoMovieVector3,
  side: "left" | "right" = "left",
): IAutoMovieQuaternion {
  const swing: IAutoMovieQuaternion = rotationBetween(
    { x: side === "left" ? 1 : -1, y: 0, z: 0 },
    fingers,
  );
  const turned: IAutoMovieVector3 = Quaternion.rotateVector(swing, {
    x: 0,
    y: -1,
    z: 0,
  });
  const axis: IAutoMovieVector3 = Vector3.normalize(fingers);
  const angle: number =
    (Math.atan2(
      Vector3.dot(axis, Vector3.cross(turned, palm)),
      Vector3.dot(turned, palm),
    ) *
      180) /
    Math.PI;
  return Quaternion.normalize(
    Quaternion.multiply(Quaternion.fromAxisAngle(axis, angle), swing),
  );
}
