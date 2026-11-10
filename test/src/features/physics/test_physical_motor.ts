import { Quaternion, physicalJointMotorCommand } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/** Native substep of a 120 Hz world with eight substeps, seconds. */
const DT: number = 1 / 960;

/** Joint motors command backward-Euler PD on the geodesic error, bounded by the declared torque and twist limits.
 *
 * Scenarios:
 * 1. A single-axis error yields the implicit PD speed (k e) / (c + k dt) with the declared cap.
 * 2. A rotation past half a turn is driven the short way.
 * 3. A compound rotation reads the geodesic rotation vector, not per-axis 2 asin(q_i).
 * 4. Zero strength commands no active speed; passive damping alone keeps the cap, nothing keeps none.
 * 5. Feed-forward torque adds f / d and a target speed adds its own value; a demand above the cap (6 N m against 3) forecasts saturation, an actual speed at the commanded one does not.
 * 6. A joint at its twist limit is not driven further out.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Quaternion`, `physicalJointMotorCommand` on in-memory inputs and asserts the returned observations through 6x TestValidator.predicate; 6 numbered scenarios (first: A single-axis error yields the implicit PD speed (k e) / (c + k dt) with the declared cap.; last: A joint at its twist limit is not driven further out.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (6 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 6 numbered scenarios (first: A single-axis error yields the implicit PD speed (k e) / (c + k dt) with the declared cap.; last: A joint at its twist limit is not driven further out.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_motor`, which owns the cases delegated to `nclose`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A single-axis error yields the implicit PD speed (k e) / (c + k dt) with the declared cap.).
 */
export function test_physical_motor(): void {
  const joint: P.IJoint = hinge();
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const zero: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  const base: Parameters<typeof physicalJointMotorCommand>[0] = {
    joint,
    current: identity,
    target: Quaternion.fromAxisAngle(
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
  const plain: physicalJointMotorCommand.IOutput =
    physicalJointMotorCommand(base);
  TestValidator.predicate(
    "implicit PD speed and declared cap",
    nclose(axis(plain, "z").speed, (k * 0.3) / d, 1e-12) &&
      nclose(axis(plain, "z").damping, d, 1e-12) &&
      axis(plain, "z").maximumTorque === 3 &&
      nclose(plain.error, 0.3, 1e-12) &&
      nclose(axis(plain, "x").speed, 0, 1e-12),
  );

  // 350 degrees about z is -10 degrees on the short arc.
  const around: physicalJointMotorCommand.IOutput = physicalJointMotorCommand({
    ...base,
    target: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 350),
  });
  TestValidator.predicate(
    "short-arc error",
    nclose(around.error, (10 * Math.PI) / 180, 1e-12) &&
      axis(around, "z").speed < 0,
  );

  // A compound rotation of 0.4 rad about (1, 1, 0) / sqrt 2.
  const compound: physicalJointMotorCommand.IOutput = physicalJointMotorCommand(
    {
      ...base,
      target: Quaternion.fromAxisAngle(
        { x: Math.SQRT1_2, y: Math.SQRT1_2, z: 0 },
        0.4 * (180 / Math.PI),
      ),
    },
  );
  const component: number = 0.4 * Math.SQRT1_2;
  TestValidator.predicate(
    "geodesic compound error",
    nclose(axis(compound, "x").speed, (k * component) / d, 1e-12) &&
      nclose(axis(compound, "y").speed, (k * component) / d, 1e-12) &&
      !nclose(
        axis(compound, "x").speed,
        (k * 2 * Math.asin(Math.sin(0.2) * Math.SQRT1_2)) / d,
        1e-6,
      ),
  );

  // Withdrawn strength keeps only passive damping.
  const withdrawn: physicalJointMotorCommand.IOutput =
    physicalJointMotorCommand({ ...base, strength: 0 });
  const passive: P.IJoint = hinge(0.5);
  const damped: physicalJointMotorCommand.IOutput = physicalJointMotorCommand({
    ...base,
    joint: passive,
    strength: 0,
  });
  TestValidator.predicate(
    "withdrawn and passive motors",
    axis(withdrawn, "z").speed === 0 &&
      axis(withdrawn, "z").maximumTorque === 0 &&
      axis(damped, "z").speed === 0 &&
      nclose(axis(damped, "z").damping, 0.5, 1e-12) &&
      axis(damped, "z").maximumTorque === 3,
  );

  // Feed-forward, target speed and saturation forecasts.
  const fed: physicalJointMotorCommand.IOutput = physicalJointMotorCommand({
    ...base,
    feedForward: { x: 0, y: 0, z: 2 },
    targetVelocity: { x: 0, y: 0, z: 1.5 },
    velocity: { x: 0, y: 0, z: -100 },
  });
  TestValidator.predicate(
    "feed-forward and target speed",
    nclose(axis(fed, "z").speed, (k * 0.3 + d * 1.5 + 2) / d, 1e-12) &&
      fed.saturated.includes("z") &&
      plain.saturated.includes("z") &&
      !physicalJointMotorCommand({
        ...base,
        velocity: { x: 0, y: 0, z: (k * 0.3) / d },
      }).saturated.includes("z"),
  );

  // At the +0.6 rad twist limit, a target beyond it commands no outward speed.
  const limited: physicalJointMotorCommand.IOutput = physicalJointMotorCommand({
    ...base,
    current: Quaternion.fromAxisAngle(
      { x: 0, y: 0, z: 1 },
      0.6 * (180 / Math.PI),
    ),
    target: Quaternion.fromAxisAngle(
      { x: 0, y: 0, z: 1 },
      0.9 * (180 / Math.PI),
    ),
  });
  TestValidator.predicate(
    "limit-bounded speed",
    axis(limited, "z").speed <= 1e-9 && limited.error > 0.29,
  );
}

/** One axis of a motor command. */
function axis(
  command: physicalJointMotorCommand.IOutput,
  name: "x" | "y" | "z",
): physicalJointMotorCommand.IAxis {
  return command.axes.find(
    (candidate: physicalJointMotorCommand.IAxis): boolean =>
      candidate.axis === name,
  )!;
}

/** A three-axis joint with a +-0.6 rad twist about z and the given passive damping. */
function hinge(passiveDamping?: number): P.IJoint {
  const identity: P.ITransform = {
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
      (name: "x" | "y" | "z"): P.IAxis => ({
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
