import {
  Quaternion,
  Vector3,
  physicalRecoverySupportGoals,
  physicalSwingReference,
  samplePhysicalRecoveryGoal,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the seeding share, the joint-centre chain and the shared path.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `physicalSwingReference` and `physicalRecoverySupportGoals` and reads their poses and goals.
 * @evidence contracts/development/testing.md#independent-expectations Joint angles are read back as relative rotations about one axis; the path is checked against the shared sampler plus the stated hang, and against the closed form 16 h (p (1 - p))^2 at mid-swing.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates share zero, one half and one, a pelvis reference apart from the actual pelvis, the start, middle and end of the swing, and a drive's path from the policy's.
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

  TestValidator.equals("swing reference", failures, []);
}
