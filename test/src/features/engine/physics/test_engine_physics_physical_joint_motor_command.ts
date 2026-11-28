import { AutoMovieEngineQuaternion, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalJointMotorCommand,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../internal/PhysicalTolerance";
import { nclose } from "../../internal/nclose";

/** Native substep of a 120 Hz world with eight substeps, seconds. */
const DT: number = 1 / 960;

/**
 * Joint motors command backward-Euler PD on the geodesic error, bounded by the
 * declared torque and twist limits.
 *
 * Scenarios:
 *
 * 1. A single-axis error yields the implicit PD speed (k e) / (c + k dt) with the
 *    declared cap.
 * 2. A rotation past half a turn is driven the short way.
 * 3. A compound rotation reads the geodesic rotation vector, not per-axis 2
 *    asin(q_i).
 * 4. Zero strength commands no active speed; passive damping alone keeps the cap,
 *    nothing keeps none.
 * 5. Feed-forward torque adds f / d and a target speed adds its own value; a
 *    demand above the cap (6 N m against 3) forecasts saturation, an actual
 *    speed at the commanded one does not.
 * 6. A joint at its twist limit is not driven further out.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the implicit PD command and torque and twist bounds, including passive effort, target velocity and feed-forward.
 * @evidence contracts/development/testing.md#behavioral-verification Commands direct motor state for a single axis, a compound and wrapped rotation, zero strength, a torque cap and an occupied limit.
 * @evidence contracts/development/testing.md#independent-expectations Implicit speed is ke/(c + kdt). A 6 N·m demand exceeds the stated 3 N·m cap, and the geodesic rotation vector determines the compound error.
 */
export function test_engine_physics_physical_joint_motor_command(): void {
  const joint: IAutoMoviePhysicalJoint = hinge();
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const zero: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  const base: Parameters<typeof AutoMovieEnginePhysics.physicalJointMotorCommand>[0] = {
    joint,
    current: identity,
    target: AutoMovieEngineQuaternion.fromAxisAngle(
      { x: 0, y: 0, z: 1 },
      0.3 * (180 / Math.PI),
    ),
    velocity: zero,
    targetVelocity: zero,
    strength: 1,
    timestep: DT,
  };
  const k: number = 20;
  const d: number = 1 + k * DT;
  const plain: IAutoMoviePhysicalJointMotorCommand.IOutput =
    AutoMovieEnginePhysics.physicalJointMotorCommand(base);
  TestValidator.predicate(
    "implicit PD speed and declared cap",
    nclose(axis(plain, "z").speed, (k * 0.3) / d, PhysicalTolerance.ROUNDING) &&
      nclose(axis(plain, "z").damping, d, PhysicalTolerance.ROUNDING) &&
      axis(plain, "z").maximumTorque === 3 &&
      nclose(plain.error, 0.3, PhysicalTolerance.ROUNDING) &&
      nclose(axis(plain, "x").speed, 0, PhysicalTolerance.ROUNDING),
  );

  // 350 degrees about z is -10 degrees on the short arc.
  const around: IAutoMoviePhysicalJointMotorCommand.IOutput =
    AutoMovieEnginePhysics.physicalJointMotorCommand({
      ...base,
      target: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 350),
    });
  TestValidator.predicate(
    "short-arc error",
    nclose(around.error, (10 * Math.PI) / 180, PhysicalTolerance.ROUNDING) &&
      axis(around, "z").speed < 0,
  );

  // A compound rotation of 0.4 rad about (1, 1, 0) / sqrt 2.
  const compound: IAutoMoviePhysicalJointMotorCommand.IOutput =
    AutoMovieEnginePhysics.physicalJointMotorCommand({
      ...base,
      target: AutoMovieEngineQuaternion.fromAxisAngle(
        { x: Math.SQRT1_2, y: Math.SQRT1_2, z: 0 },
        0.4 * (180 / Math.PI),
      ),
    });
  const component: number = 0.4 * Math.SQRT1_2;
  TestValidator.predicate(
    "geodesic compound error",
    nclose(
      axis(compound, "x").speed,
      (k * component) / d,
      PhysicalTolerance.ROUNDING,
    ) &&
      nclose(
        axis(compound, "y").speed,
        (k * component) / d,
        PhysicalTolerance.ROUNDING,
      ) &&
      !nclose(
        axis(compound, "x").speed,
        (k * 2 * Math.asin(Math.sin(0.2) * Math.SQRT1_2)) / d,
        PhysicalTolerance.CONVERGED,
      ),
  );

  // Withdrawn strength keeps only passive damping.
  const withdrawn: IAutoMoviePhysicalJointMotorCommand.IOutput =
    AutoMovieEnginePhysics.physicalJointMotorCommand({ ...base, strength: 0 });
  const passive: IAutoMoviePhysicalJoint = hinge(0.5);
  const damped: IAutoMoviePhysicalJointMotorCommand.IOutput =
    AutoMovieEnginePhysics.physicalJointMotorCommand({
      ...base,
      joint: passive,
      strength: 0,
    });
  TestValidator.predicate(
    "withdrawn and passive motors",
    axis(withdrawn, "z").speed === 0 &&
      axis(withdrawn, "z").maximumTorque === 0 &&
      axis(damped, "z").speed === 0 &&
      nclose(axis(damped, "z").damping, 0.5, PhysicalTolerance.ROUNDING) &&
      axis(damped, "z").maximumTorque === 3,
  );

  // Feed-forward, target speed and saturation forecasts.
  const fed: IAutoMoviePhysicalJointMotorCommand.IOutput =
    AutoMovieEnginePhysics.physicalJointMotorCommand({
      ...base,
      feedForward: { x: 0, y: 0, z: 2 },
      targetVelocity: { x: 0, y: 0, z: 1.5 },
      velocity: { x: 0, y: 0, z: -100 },
    });
  TestValidator.predicate(
    "feed-forward and target speed",
    nclose(
      axis(fed, "z").speed,
      (k * 0.3 + d * 1.5 + 2) / d,
      PhysicalTolerance.ROUNDING,
    ) &&
      fed.saturated.includes("z") &&
      plain.saturated.includes("z") &&
      !AutoMovieEnginePhysics.physicalJointMotorCommand({
        ...base,
        velocity: { x: 0, y: 0, z: (k * 0.3) / d },
      }).saturated.includes("z"),
  );

  // At the +0.6 rad twist limit, a target beyond it commands no outward speed.
  const limited: IAutoMoviePhysicalJointMotorCommand.IOutput =
    AutoMovieEnginePhysics.physicalJointMotorCommand({
      ...base,
      current: AutoMovieEngineQuaternion.fromAxisAngle(
        { x: 0, y: 0, z: 1 },
        0.6 * (180 / Math.PI),
      ),
      target: AutoMovieEngineQuaternion.fromAxisAngle(
        { x: 0, y: 0, z: 1 },
        0.9 * (180 / Math.PI),
      ),
    });
  TestValidator.predicate(
    "limit-bounded speed",
    axis(limited, "z").speed <= PhysicalTolerance.ACCUMULATED &&
      limited.error > 0.29,
  );
}

/** One axis of a motor command. */
function axis(
  command: IAutoMoviePhysicalJointMotorCommand.IOutput,
  name: "x" | "y" | "z",
): IAutoMoviePhysicalJointMotorCommand.IAxis {
  return command.axes.find(
    (candidate: IAutoMoviePhysicalJointMotorCommand.IAxis): boolean =>
      candidate.axis === name,
  )!;
}

/**
 * A three-axis joint with a +-0.6 rad twist about z and the given passive
 * damping.
 */
function hinge(passiveDamping?: number): IAutoMoviePhysicalJoint {
  const identity: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  return {
    id: "hinge",
    parent: "root",
    child: "link",
    parentFrame: identity,
    childFrame: identity,
    axes: (["x", "y", "z"] as const).map(
      (name: "x" | "y" | "z"): IAutoMoviePhysicalJointAxis => ({
        axis: name,
        minimum: name === "z" ? -0.6 : -1.2,
        maximum: name === "z" ? 0.6 : 1.2,
        stiffness: 20,
        damping: 1,
        maximumTorque: 3,
        channel: `hinge.${name}`,
        ...(passiveDamping === undefined ? {} : { passiveDamping }),
      }),
    ),
  };
}
