import {
  AutoMoviePhysicalJointChart,
  Quaternion,
  Vector3,
  physicalRecoverySupportGoals,
  physicalStanceBalance,
  physicalSupportPoint,
  physicalSwingReference,
  samplePhysicalRecoveryGoal,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../internal/PhysicalDisturbance";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A lifted swing's joint references are one path, continuous at lift-off:
 *
 * 1. Seeding: on a thigh and shin hanging from a pelvis, the references at share
 *    zero hold every joint at its actual angle whatever the pelvis's
 *    reference, at share one at the fitted angle, and halfway at the angle
 *    between; each child's joint centre stays on its parent's.
 * 2. One path: the swing's endpoint goal for the joints' fit takes the drive's
 *    clearance and the foot's hang (`IAutoMovieAdvancePhysicalBalance.IResult`
 *    `.swing`) at lift-off, mid-swing and touchdown, the clearance sampled
 *    by `samplePhysicalRecoveryGoal` plus the hang; without them, the policy's
 *    clearance and no hang.
 * 3. Rates: at lift-off a joint's reference rate is its actual rate, halfway
 *    through `FADE` the mean of that and the path's, and from `FADE` on the
 *    path's, so the swing starts from the leg's present velocity (Khadiv et
 *    al. 2017, Section III-B; design-4017-edge, S1).
 * 4. Hang: a foot lifted 0.1 m and pitched 20 degrees hangs nothing at its
 *    planned level attitude, so the swing's goal is unchanged by the pitch;
 *    read at its own pitched attitude its toe would hang more than 1 cm and
 *    raise its own goal (Pratt et al., M2V2, Section VII-D1).
 * 5. Pose: the Human's right leg fitted to a foot pose 10 cm ahead and 8 cm
 *    up at its planned level attitude, on ten successive frames each seeded
 *    from the last, keeps every chain joint within 1 degree of the first fit,
 *    its endpoint within the tolerance of the goal, and the foot's rotation
 *    relative to the shank on the plan about each axis the ankle has, within
 *    0.01 rad; the turn about the axis it lacks is the hip's (Kajita et al.,
 *    Introduction to Humanoid Robotics, Section 2.5; TSID `ex_4_walking`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the seeding share, the joint-centre chain and the shared path.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `physicalSwingReference` and `physicalRecoverySupportGoals` and reads their poses and goals.
 * @evidence contracts/development/testing.md#independent-expectations Joint angles are read back as relative rotations about one axis; the path is checked against the shared sampler plus the stated hang, and against the closed form 16 h (p (1 - p))^2 at mid-swing.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates share zero, one half and one, a pelvis reference apart from the actual pelvis, the start, middle and end of the swing, a drive's path from the policy's, and a reference rate at lift-off, within the fade and past it.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory; no native world, viewer or file host.
 */
export function test_physical_swing_reference(): void {
  const failures: string[] = [];
  const near = (name: string, actual: number, expected: number): void => {
    if (!(Math.abs(actual - expected) <= 1e-9))
      failures.push(`${name}: ${actual} against ${expected}`);
  };
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const about = (degrees: number): IAutoMovieQuaternion =>
    Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, degrees);

  // 1. A thigh hinged 0.1 m beside the pelvis and a shin 0.4 m below it.
  const joints: IAutoMoviePhysicalJoint[] = [
    {
      parent: "pelvis",
      child: "thigh",
      parentFrame: { position: { x: 0.1, y: 0, z: 0 }, rotation: identity },
      childFrame: { position: { x: 0, y: 0.2, z: 0 }, rotation: identity },
    },
    {
      parent: "thigh",
      child: "shin",
      parentFrame: { position: { x: 0, y: -0.2, z: 0 }, rotation: identity },
      childFrame: { position: { x: 0, y: 0.2, z: 0 }, rotation: identity },
    },
  ] as unknown as IAutoMoviePhysicalJoint[];
  const chain = (
    pelvis: IAutoMovieQuaternion,
    hip: number,
    knee: number,
  ): Record<string, IAutoMovieRigidTransform> => {
    const thigh: IAutoMovieQuaternion = Quaternion.multiply(pelvis, about(hip));
    const shin: IAutoMovieQuaternion = Quaternion.multiply(thigh, about(knee));
    return {
      pelvis: { position: { x: 0, y: 1, z: 0 }, rotation: pelvis },
      thigh: { position: { x: 0, y: 0, z: 0 }, rotation: thigh },
      shin: { position: { x: 0, y: 0, z: 0 }, rotation: shin },
    };
  };
  const actual: Record<string, IAutoMovieRigidTransform> = chain(
    identity,
    20,
    40,
  );
  const fit: Record<string, IAutoMovieRigidTransform> = chain(identity, 5, 10);
  const base: IAutoMovieRigidTransform = {
    position: { x: 0.02, y: 0.98, z: 0.01 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 10),
  };
  const angle = (
    parent: IAutoMovieQuaternion,
    child: IAutoMovieQuaternion,
  ): number => {
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(parent),
      child,
    );
    const sign: number = turn.w < 0 ? -1 : 1;
    return (2 * Math.atan2(sign * turn.x, sign * turn.w) * 180) / Math.PI;
  };
  for (const [share, hip, knee] of [
    [0, 20, 40],
    [0.5, 12.5, 25],
    [1, 5, 10],
  ] as const) {
    const out: Record<string, IAutoMovieRigidTransform> =
      physicalSwingReference({ joints, base, actual, fit, share });
    near(`hip at ${share}`, angle(base.rotation, out.thigh!.rotation), hip);
    near(
      `knee at ${share}`,
      angle(out.thigh!.rotation, out.shin!.rotation),
      knee,
    );
    // Each child's joint centre on its parent's.
    for (const joint of joints) {
      const parent: IAutoMovieRigidTransform =
        out[joint.parent] ?? base;
      const child: IAutoMovieRigidTransform = out[joint.child]!;
      const gap: IAutoMovieVector3 = Vector3.subtract(
        Vector3.add(
          parent.position,
          Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
        ),
        Vector3.add(
          child.position,
          Quaternion.rotateVector(child.rotation, joint.childFrame.position),
        ),
      );
      near(`${joint.child} centre at ${share}`, Vector3.length(gap), 0);
    }
  }

  // 2. A swing over 0.3 m in 0.4 s, from a foot planted 0.05 m up.
  const step = { yaw: 0, pitch: 0, clearance: 0 };
  const swing: NonNullable<IAutoMoviePhysicalRecoveryState["swing"]> = {
    bone: "foot",
    kind: "swing",
    start: 0,
    end: 0.4,
    from: { ...step, point: [0, 0] },
    to: { ...step, point: [0, 0.3] },
  } as unknown as NonNullable<IAutoMoviePhysicalRecoveryState["swing"]>;
  const pattern = {
    limbs: [{ bone: "foot", chain: ["foot"], localPoint: { x: 0, y: 0, z: 0 } }],
  };
  const body = {
    balance: { pattern, height: 0.1 },
  } as unknown as IAutoMoviePhysicalSimulationInput.IBody;
  const target = {
    segments: {
      foot: { position: { x: 0, y: 0.05, z: 0 }, rotation: identity },
    },
  } as unknown as IAutoMoviePhysicalSimulationInput.ITarget;
  const state = {
    swing,
    seating: {},
    offsets: {},
    steps: [],
  } as unknown as IAutoMoviePhysicalRecoveryState;
  const path: { height: number; hang: number } = { height: 0.06, hang: 0.02 };
  for (const seconds of [0, 0.2, 0.4]) {
    const goal: IAutoMovieVector3 = physicalRecoverySupportGoals(
      body,
      target,
      body.balance!.pattern,
      state,
      seconds,
      path,
    ).foot!;
    const sampled: IAutoMovieVector3 = samplePhysicalRecoveryGoal({
      swing,
      point: { x: 0, y: 0.05, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      height: path.height,
      seconds,
    }).point;
    near(`goal height at ${seconds}`, goal.y, sampled.y + path.hang);
    near(`goal ahead at ${seconds}`, goal.z, sampled.z);
  }
  const middle: IAutoMovieVector3 = physicalRecoverySupportGoals(
    body,
    target,
    body.balance!.pattern,
    state,
    0.2,
    path,
  ).foot!;
  near("mid-swing height", middle.y, 0.05 + 0.06 + 0.02);
  const policy: IAutoMovieVector3 = physicalRecoverySupportGoals(
    body,
    target,
    body.balance!.pattern,
    state,
    0.2,
  ).foot!;
  near("policy's mid-swing height", policy.y, 0.05 + 0.1);

  // 3. The reference rate from the joint's actual rate to the path's.
  const moving: IAutoMovieVector3 = { x: 2, y: -1, z: 0.5 };
  const planned: IAutoMovieVector3 = { x: 0, y: 0.4, z: 0 };
  for (const [elapsed, share] of [
    [0, 0],
    [physicalStanceBalance.FADE / 2, 0.5],
    [physicalStanceBalance.FADE, 1],
    [2 * physicalStanceBalance.FADE, 1],
  ] as const) {
    const rate: IAutoMovieVector3 = physicalSwingReference.rate({
      actual: moving,
      path: planned,
      elapsed,
    });
    for (const axis of ["x", "y", "z"] as const)
      near(
        `rate ${axis} at ${elapsed}`,
        rate[axis],
        moving[axis] + (planned[axis] - moving[axis]) * share,
      );
  }

  // 4. The hang at the planned attitude: a 0.2 by 0.1 by 0.08 m foot box
  // planted level with its endpoint 0.04 m above its centre.
  const box: IAutoMoviePhysicalProfile = {
    segments: [
      {
        bone: "foot",
        mass: 1,
        centerOfMass: { x: 0, y: 0, z: 0 },
        inertia: { x: 1, y: 1, z: 1 },
        inertiaRotation: identity,
        neutral: { position: { x: 0, y: 0.04, z: 0 }, rotation: identity },
        shapes: [
          {
            kind: "box",
            halfExtents: { x: 0.05, y: 0.04, z: 0.1 },
            transform: { position: { x: 0, y: 0, z: 0 }, rotation: identity },
          },
        ],
      },
    ],
    joints: [],
  } as unknown as IAutoMoviePhysicalProfile;
  const plantedFoot: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0.04, z: 0 },
    rotation: identity,
  };
  const rest: IAutoMovieVector3 = { x: 0, y: 0.08, z: 0 };
  // The actual foot 0.1 m up and pitched 20 degrees about its endpoint.
  const lifted: IAutoMovieVector3 = { x: 0, y: 0.18, z: 0.05 };
  const pitch: IAutoMovieQuaternion = about(20);
  const pitched: IAutoMovieRigidTransform = {
    position: Vector3.add(
      lifted,
      Quaternion.rotateVector(pitch, { x: 0, y: -0.04, z: 0 }),
    ),
    rotation: pitch,
  };
  const hangAt = (
    planned: (bone: string) => IAutoMovieRigidTransform | undefined,
  ): number =>
    physicalSwingReference.hang({
      profile: box,
      carriers: ["foot"],
      planned,
      endpoint: lifted,
      planted: (): IAutoMovieRigidTransform => plantedFoot,
      rest,
    });
  // Planned level and carried with the endpoint: the pitch leaves it unchanged.
  const level: number = hangAt((): IAutoMovieRigidTransform => ({
    position: Vector3.add(plantedFoot.position, Vector3.subtract(lifted, rest)),
    rotation: identity,
  }));
  near("level planned hang", level, 0);
  // Read at the pitched foot itself, its toe would raise its own goal.
  if (!(hangAt((): IAutoMovieRigidTransform => pitched) > 0.01))
    failures.push("a pitched foot's own attitude hangs nothing");

  // 5. The Human's right leg fitted to a full foot pose, 10 cm ahead and 8 cm
  // up, on ten successive frames from the previous fit.
  const human = PhysicalDisturbance.standing(motionHumanBody("m-average"));
  const limb = human.body().balance!.pattern.limbs.find(
    (candidate) => candidate.bone === "rightFoot",
  )!;
  const hip: IAutoMoviePhysicalJoint = human.profile.joints.find(
    (joint: IAutoMoviePhysicalJoint): boolean => joint.child === limb.chain[0],
  )!;
  const standingPoint: IAutoMovieVector3 = physicalSupportPoint(
    human.targets[limb.bone]!,
    limb.localPoint,
  );
  const swingGoal: IAutoMovieVector3 = {
    x: standingPoint.x,
    y: standingPoint.y + 0.08,
    z: standingPoint.z + 0.1,
  };
  const plannedFoot: IAutoMovieQuaternion = human.targets[limb.bone]!.rotation;
  const ankleJoint: IAutoMoviePhysicalJoint = human.profile.joints.find(
    (joint: IAutoMoviePhysicalJoint): boolean => joint.child === limb.bone,
  )!;
  const relativeAngle = (
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
    child: string,
  ): number => {
    const joint: IAutoMoviePhysicalJoint = human.profile.joints.find(
      (candidate: IAutoMoviePhysicalJoint): boolean => candidate.child === child,
    )!;
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(
        Quaternion.multiply(poses[joint.parent]!.rotation, joint.parentFrame.rotation),
      ),
      Quaternion.multiply(poses[child]!.rotation, joint.childFrame.rotation),
    );
    return (2 * Math.acos(Math.min(1, Math.abs(turn.w))) * 180) / Math.PI;
  };
  let seed: Record<string, IAutoMovieRigidTransform> = { ...human.targets };
  let first: number[] | undefined;
  for (let frame: number = 0; frame < 10; frame++) {
    const fitted = physicalSwingReference.pose({
      profile: human.profile,
      chain: limb.chain,
      base: human.targets[hip.parent]!,
      seed,
      authored: human.targets,
      goal: swingGoal,
      ...(limb.localPoint ? { localPoint: limb.localPoint } : {}),
      rotation: plannedFoot,
      iterations: 24,
      tolerance: 0.001,
    });
    seed = { ...seed, ...fitted.targets };
    const angles: number[] = limb.chain.map((bone: string): number =>
      relativeAngle(seed, bone),
    );
    first ??= angles;
    angles.forEach((angle: number, i: number): void => {
      if (!(Math.abs(angle - first![i]!) <= 1))
        failures.push(`frame ${frame}: ${limb.chain[i]} at ${angle} against ${first![i]}`);
    });
    // The ankle's free axes take the plan's rotation relative to the shank;
    // what remains turns about the axis it does not have.
    const socket: IAutoMovieQuaternion = Quaternion.multiply(
      seed[ankleJoint.parent]!.rotation,
      ankleJoint.parentFrame.rotation,
    );
    const wanted: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(socket),
      Quaternion.multiply(plannedFoot, ankleJoint.childFrame.rotation),
    );
    const held: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(socket),
      Quaternion.multiply(seed[limb.bone]!.rotation, ankleJoint.childFrame.rotation),
    );
    const left: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(held),
      wanted,
    );
    const sign: number = left.w < 0 ? -1 : 1;
    const span: number = Math.hypot(left.x, left.y, left.z);
    const scale: number =
      span > 1e-12 ? (2 * Math.atan2(span, Math.abs(left.w)) * sign) / span : 2 * sign;
    // An axis the plan drives past its range stops at its limit.
    const coordinate = (axis: "x" | "y" | "z"): number => {
      if (ankleJoint.order !== undefined)
        return AutoMoviePhysicalJointChart.angles(ankleJoint.order, held)[
          ankleJoint.order.indexOf(axis)
        ]!;
      const w: number = held.w < 0 ? -held.w : held.w;
      return 2 * Math.atan((held.w < 0 ? -held[axis] : held[axis]) / w);
    };
    for (const axis of ankleJoint.axes) {
      const at: number = coordinate(axis.axis);
      const limited: boolean =
        Math.abs(at - axis.minimum) < 1e-6 || Math.abs(at - axis.maximum) < 1e-6;
      if (!limited && !(Math.abs(left[axis.axis] * scale) <= 0.01))
        failures.push(
          `frame ${frame}: the ankle's ${axis.axis} at ${at} misses the plan by ${left[axis.axis] * scale} rad`,
        );
    }
    if (!(fitted.residual <= 0.001))
      failures.push(`frame ${frame}: the endpoint misses its goal by ${fitted.residual} m`);
  }

  TestValidator.equals("swing reference", failures, []);
}
