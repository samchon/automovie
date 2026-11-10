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
 * A leg's knee follows its hint, a toe-out foot heading is reached by the
 * leg's swivel (the hip's rotation), the two legs mirror, and an infeasible
 * foot reports its honest residual.
 *
 * The rig is a kinematic chain fixture: a pelvis at 0.95 m with two legs
 * (hip 0.09 m off the midline, thigh 0.42 m, shank 0.42 m, a foot bone at the
 * ankle) in the canonical rest, read with HUMANOID_JOINT_AXES,
 * HUMANOID_REST_FRAME and the default range of motion, the pelvis 0.05 m
 * lower than the straight leg.
 *
 * Scenarios:
 * 1. Two hints across the leg axis, one straight ahead and one ahead and
 *    out, with the ankle 0.2 m ahead: each solve puts the knee nearer its own
 *    hint's direction than the other solve does, and lands the ankle within
 *    1 mm.
 * 2. Gait stance samples placed by sagittal geometry (hip and knee flexion
 *    of early stance, 25 and 13 degrees, and of midstance, -3 and 12 degrees,
 *    so the shank tilts about 12 and 15 degrees), each with toe-out goals of
 *    7, 11 and 15 degrees on the left foot: the foot's world rotation is
 *    reached within 1 degree and the ankle within 1 mm.
 * 3. The right leg solving each mirrored goal gives the same clinical angles
 *    within 1e-6 degrees and the mirrored knee within 1e-6 m.
 * 4. Honesty: a crouch with the ankle under the hip tilts the shank by more
 *    than the ankle's 20 degree dorsiflexion limit; the foot's heading is
 *    still reached within 1 degree, its total rotation misses by the tilt less
 *    that limit within 0.5 degree (the tilt computed from the leg's triangle),
 *    and no joint leaves its range.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public fit and reads the result through forward kinematics; a knee that ignores its hint, a foot heading the swivel does not reach, an asymmetric pair, or a crouch that claims a level foot or breaks a range fails.
 * @evidence contracts/development/testing.md#independent-expectations Positions and rotations come from forward kinematics and goals written here; stance angles follow normal gait kinematics (Perry and Burnfield, initial contact and midstance); 7 to 15 degrees is the adult foot progression range and 1 degree the walk's heading need; the crouch residual is the shank tilt from the leg triangle less DEFAULT_HUMANOID_ROM's dorsiflexion maximum; the mirror is the rig's sagittal symmetry.
 * @evidence contracts/development/testing.md#distinguishing-cases Two hint directions, two stance phases, three toe-out angles, both sides, and an infeasible crouch; arm chains are owned by test_motion_fit_chain_reach.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory engine unit with no body or render; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_motion_fit_chain_leg(): void {
  const skeleton: IAutoMovieSkeleton = legs();
  const failures: string[] = [];
  const check = (label: string, ok: boolean): void => {
    if (!ok) failures.push(label);
  };
  const hip: IAutoMovieVector3 = { x: 0.09, y: 0.85, z: 0 };
  const mirror = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: -p.x,
    y: p.y,
    z: p.z,
  });
  const heading = (q: IAutoMovieQuaternion): number => {
    const f: IAutoMovieVector3 = Quaternion.rotateVector(q, {
      x: 0,
      y: 0,
      z: 1,
    });
    return (Math.atan2(f.x, f.z) * 180) / Math.PI;
  };

  // 1. The hint decides the knee.
  const ankle: IAutoMovieVector3 = { x: 0.09, y: 0.11, z: 0.2 };
  const ahead: IAutoMovieVector3 = { x: 0.09, y: 0.5, z: 1 };
  const outward: IAutoMovieVector3 = { x: 0.8, y: 0.5, z: 0.6 };
  const axis: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(ankle, hip),
  );
  const across = (p: IAutoMovieVector3): IAutoMovieVector3 => {
    const v: IAutoMovieVector3 = Vector3.subtract(p, hip);
    return Vector3.normalize(
      Vector3.subtract(v, Vector3.scale(axis, Vector3.dot(v, axis))),
    );
  };
  const knees: IAutoMovieVector3[] = [ahead, outward].map(
    (hint: IAutoMovieVector3): IAutoMovieVector3 => {
      const bones = fk(skeleton, fit(skeleton, "left", ankle, hint));
      const miss: number = Vector3.length(
        Vector3.subtract(bones.get("leftFoot")!.worldPosition, ankle),
      );
      check(
        `ankle reached for a hint (${(miss * 1000).toFixed(2)} mm)`,
        miss <= 0.001,
      );
      return across(bones.get("leftLowerLeg")!.worldPosition);
    },
  );
  check(
    "the ahead hint keeps the knee ahead",
    Vector3.dot(knees[0]!, across(ahead)) >
      Vector3.dot(knees[1]!, across(ahead)),
  );
  check(
    "the outward hint turns the knee out",
    Vector3.dot(knees[1]!, across(outward)) >
      Vector3.dot(knees[0]!, across(outward)),
  );

  // 2-3. Toe-out by the leg's swivel at gait stance samples, mirrored.
  const stance = (thigh: number, knee: number): IAutoMovieVector3 => {
    const t: number = (thigh * Math.PI) / 180;
    const s: number = ((thigh - knee) * Math.PI) / 180;
    return {
      x: hip.x,
      y: hip.y - 0.42 * Math.cos(t) - 0.42 * Math.cos(s),
      z: hip.z + 0.42 * Math.sin(t) + 0.42 * Math.sin(s),
    };
  };
  const samples: [string, IAutoMovieVector3][] = [
    ["early stance", stance(25, 13)],
    ["midstance", stance(-3, 12)],
  ];
  for (const [phase, foot] of samples)
    for (const toeOut of [7, 11, 15]) {
      const label: string = `${phase} toe-out ${toeOut}`;
      const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        toeOut,
      );
      const left: IAutoMoviePose = fit(skeleton, "left", foot, ahead, rotation);
      const bones = fk(skeleton, left);
      const error: number = angle(
        bones.get("leftFoot")!.worldRotation,
        rotation,
      );
      check(`${label}: foot within 1 degree (${error.toFixed(2)})`, error <= 1);
      check(
        `${label}: ankle within 1 mm`,
        Vector3.length(
          Vector3.subtract(bones.get("leftFoot")!.worldPosition, foot),
        ) <= 0.001,
      );
      const right: IAutoMoviePose = fit(
        skeleton,
        "right",
        mirror(foot),
        mirror(ahead),
        { x: rotation.x, y: -rotation.y, z: -rotation.z, w: rotation.w },
      );
      const mirrored = fk(skeleton, right);
      for (const [l, r] of [
        ["leftUpperLeg", "rightUpperLeg"],
        ["leftLowerLeg", "rightLowerLeg"],
        ["leftFoot", "rightFoot"],
      ] as const) {
        const a: IAutoMovieJointPose = joint(left, l);
        const b: IAutoMovieJointPose = joint(right, r);
        check(
          `${label}: ${l} mirrors in angle`,
          [
            (a.flexion ?? 0) - (b.flexion ?? 0),
            (a.abduction ?? 0) - (b.abduction ?? 0),
            (a.twist ?? 0) - (b.twist ?? 0),
          ].every((d: number): boolean => Math.abs(d) < 1e-6),
        );
      }
      check(
        `${label}: knee mirrors`,
        Vector3.length(
          Vector3.subtract(
            mirror(bones.get("leftLowerLeg")!.worldPosition),
            mirrored.get("rightLowerLeg")!.worldPosition,
          ),
        ) < 1e-6,
      );
    }

  // 4. Honesty: a crouch past the ankle's dorsiflexion.
  const under: IAutoMovieVector3 = { x: 0.09, y: 0.11, z: 0.02 };
  const span: number = Vector3.length(Vector3.subtract(under, hip));
  const tilt: number =
    ((Math.acos(span / 2 / 0.42) -
      Math.atan2(under.z - hip.z, hip.y - under.y)) *
      180) /
    Math.PI;
  const limit: number = DEFAULT_HUMANOID_ROM.leftFoot!.flexion!.max;
  const goal: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    11,
  );
  const crouch: IAutoMoviePose = fit(skeleton, "left", under, ahead, goal);
  const shown: IAutoMovieQuaternion = fk(skeleton, crouch).get(
    "leftFoot",
  )!.worldRotation;
  check(
    `crouch: heading reached (${heading(shown).toFixed(2)})`,
    Math.abs(heading(shown) - 11) <= 1,
  );
  check(
    `crouch: residual is the tilt beyond dorsiflexion (${angle(shown, goal).toFixed(2)} vs ${(tilt - limit).toFixed(2)})`,
    Math.abs(angle(shown, goal) - (tilt - limit)) <= 0.5,
  );
  for (const bone of ["leftUpperLeg", "leftLowerLeg", "leftFoot"] as const)
    check(`crouch: ${bone} in range`, inRange(joint(crouch, bone)));
  TestValidator.predicate(
    failures.join("; ") || "all checks",
    failures.length === 0,
  );
}

/** A pelvis with two legs at rest. */
function legs(): IAutoMovieSkeleton {
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
    id: "legs",
    bones: [
      bone("hips", null, 0, 0.95),
      bone("leftUpperLeg", "hips", 0.09, -0.05),
      bone("leftLowerLeg", "leftUpperLeg", 0, -0.42),
      bone("leftFoot", "leftLowerLeg", 0, -0.42),
      bone("rightUpperLeg", "hips", -0.09, -0.05),
      bone("rightLowerLeg", "rightUpperLeg", 0, -0.42),
      bone("rightFoot", "rightLowerLeg", 0, -0.42),
    ],
  };
}

/** Fit one leg with the pelvis lowered 0.05 m. */
function fit(
  skeleton: IAutoMovieSkeleton,
  side: "left" | "right",
  target: IAutoMovieVector3,
  bend: IAutoMovieVector3,
  effectorRotation?: IAutoMovieQuaternion,
): IAutoMoviePose {
  return fitChainToTarget({
    skeleton,
    pose: {
      skeleton: skeleton.id,
      root: {
        translation: { x: 0, y: -0.05, z: 0 },
        rotation: Quaternion.identity(),
        scale: { x: 1, y: 1, z: 1 },
      },
      joints: [],
    },
    chain: {
      upper: `${side}UpperLeg`,
      lower: `${side}LowerLeg`,
      effector: `${side}Foot`,
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

/** The angle between two rotations, degrees. */
function angle(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number {
  const dot: number = Math.min(
    1,
    Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w),
  );
  return (2 * Math.acos(dot) * 180) / Math.PI;
}
