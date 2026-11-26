import { Quaternion, physicalStanceJointTarget, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/**
 * The least error that counts as kept, radians: a milliradian, far above any
 * rounding, so a cancelled axis cannot pass as a kept one.
 */
const SIGNIFICANT: number = 1e-3;

/**
 * A stance joint's motor reference follows its role, not the pose the body
 * happened to have when a foot landed:
 *
 * Scenarios:
 *
 * 1. Posture: a knee's target is the goal pose's relative rotation, the authored
 *    pose refit to the footholds, whatever the knee's actual angle; two
 *    different actual angles give the same target (TSID's posture task).
 * 2. Hip: with the pelvis pitched 0.3 rad over a fixed thigh, the target, reached
 *    with the thigh where it is, puts the pelvis at its intended world
 *    orientation, and the PD's torque on the pelvis turns it back against its
 *    pitch (Yin, Loken and van de Panne 2007, Section 3.2).
 * 3. Planted: a foot's target is its latched world orientation against the actual
 *    shank, whatever the shank's lean.
 * 4. Released: during a hip strategy about x, the hip turns back a pelvis's roll
 *    but leaves its pitch, and asks its own spin along x (design-4017-edge,
 *    E2).
 */
export function test_engine_physics_physical_stance_joint_target(): void {
  const findings: string[] = [];
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const frame: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    20,
  );
  const goalThigh: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 0, z: 0 },
    -15,
  );
  const goalShank: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 0, z: 0 },
    20,
  );
  const goal = {
    parent: goalThigh,
    child: goalShank,
    parentSpin: zero,
    childSpin: zero,
  };

  // 1. The knee keeps the goal posture.
  const expected: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.inverse(Quaternion.multiply(goalThigh, frame)),
    Quaternion.multiply(goalShank, frame),
  );
  for (const knee of [10, 70]) {
    const target: IAutoMovieQuaternion = physicalStanceJointTarget({
      role: "posture",
      parentFrame: frame,
      childFrame: frame,
      actual: {
        parent: goalThigh,
        child: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, knee),
        parentSpin: zero,
        childSpin: zero,
      },
      goal,
    }).target;
    if (!near(target, expected))
      findings.push(`a knee at ${knee} deg aims at ${JSON.stringify(target)}`);
  }

  // 2. The hip holds the pelvis at its intended world orientation.
  const intended: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const pitched: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 0, z: 0 },
    (0.3 * 180) / Math.PI,
  );
  const thigh: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 0, z: 0 },
    -10,
  );
  const hip: IAutoMovieQuaternion = physicalStanceJointTarget({
    role: "hip",
    parentFrame: frame,
    childFrame: frame,
    actual: {
      parent: pitched,
      child: thigh,
      parentSpin: zero,
      childSpin: zero,
    },
    goal,
    intended: { rotation: intended, spin: zero },
  }).target;
  const pelvis: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.multiply(
      Quaternion.multiply(thigh, frame),
      Quaternion.inverse(hip),
    ),
    Quaternion.inverse(frame),
  );
  if (!near(pelvis, intended))
    findings.push(
      `the hip target leaves the pelvis at ${JSON.stringify(pelvis)}`,
    );
  const command = AutoMovieEnginePhysics.physicalJointMotorCommand({
    joint: {
      id: "hip",
      parent: "pelvis",
      child: "thigh",
      parentFrame: { position: zero, rotation: frame },
      childFrame: { position: zero, rotation: frame },
      axes: (["x", "y", "z"] as const).map((axis: "x" | "y" | "z") => ({
        axis,
        minimum: -2,
        maximum: 2,
        stiffness: 100,
        damping: 10,
        maximumTorque: 200,
        channel: axis,
      })),
    } satisfies IAutoMoviePhysicalJoint,
    current: Quaternion.multiply(
      Quaternion.inverse(Quaternion.multiply(pitched, frame)),
      Quaternion.multiply(thigh, frame),
    ),
    target: hip,
    velocity: zero,
    targetVelocity: zero,
    strength: 1,
    timestep: 1 / 960,
  });
  // The motor's torque on the pelvis is minus its axes' speeds in the
  // joint frame turned into the world: it must oppose the pelvis's +x pitch.
  const speed: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const axis of command.axes) speed[axis.axis] = axis.speed;
  const onPelvis: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(pitched, frame),
    { x: -speed.x, y: -speed.y, z: -speed.z },
  );
  if (
    !(onPelvis.x < 0) ||
    !(Math.abs(command.error - 0.3) < PhysicalTolerance.ACCUMULATED)
  )
    findings.push(
      `the hip turns the pelvis by ${JSON.stringify(onPelvis)} for an error of ${command.error}`,
    );

  // 3. The planted foot holds its latched world orientation.
  const latched: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    5,
  );
  for (const lean of [-12, 18]) {
    const shank: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 1, y: 0, z: 0 },
      lean,
    );
    const ankle: IAutoMovieQuaternion = physicalStanceJointTarget({
      role: "planted",
      parentFrame: frame,
      childFrame: frame,
      actual: {
        parent: shank,
        child: shank,
        parentSpin: zero,
        childSpin: zero,
      },
      goal,
      latched,
    }).target;
    const foot: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(Quaternion.multiply(shank, frame), ankle),
      Quaternion.inverse(frame),
    );
    if (!near(foot, latched))
      findings.push(
        `a shank leaning ${lean} deg aims the foot at ${JSON.stringify(foot)}`,
      );
  }

  // 4. Released about x during a hip strategy: with the pelvis pitched 0.3
  // rad and rolled 0.1 rad, the hip's target leaves the pitch as it is and
  // turns back the roll only, the error's twist about x removed; the spin
  // asked along x is the pelvis's own, 2 rad/s, and none across it.
  const rolled: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, (0.1 * 180) / Math.PI),
    pitched,
  );
  const axis: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const released = physicalStanceJointTarget({
    role: "hip",
    parentFrame: frame,
    childFrame: frame,
    actual: {
      parent: rolled,
      child: thigh,
      parentSpin: { x: 2, y: 0, z: 1 },
      childSpin: zero,
    },
    goal,
    intended: { rotation: intended, spin: zero },
    release: axis,
  });
  const kept: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.multiply(
      Quaternion.multiply(thigh, frame),
      Quaternion.inverse(released.target),
    ),
    Quaternion.inverse(frame),
  );
  const error: IAutoMovieQuaternion = Quaternion.multiply(
    kept,
    Quaternion.inverse(rolled),
  );
  if (
    !(Math.abs(error.x) < PhysicalTolerance.ACCUMULATED) ||
    !(Math.abs(error.z) > SIGNIFICANT)
  )
    findings.push(
      `a hip released about x moves the pelvis by ${JSON.stringify(error)}`,
    );
  const asked: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(kept, frame),
    released.velocity,
  );
  if (
    !(Math.abs(asked.x + 2) < PhysicalTolerance.ACCUMULATED) ||
    !(Math.abs(asked.y) < PhysicalTolerance.ACCUMULATED) ||
    !(Math.abs(asked.z) < PhysicalTolerance.ACCUMULATED)
  )
    findings.push(
      `a hip released about x asks the spin ${JSON.stringify(asked)}`,
    );

  TestValidator.equals("stance joint targets", findings, []);
}

/** Whether two rotations agree within the accumulated rounding, either sign. */
function near(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): boolean {
  const dot: number = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  return Math.abs(Math.abs(dot) - 1) < PhysicalTolerance.ACCUMULATED;
}
