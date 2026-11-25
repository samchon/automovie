import {
  AutoMoviePhysicalJointChart,
  measurePhysicalJointLimits,
  physicalJointMotorCommand,
  projectPhysicalJointVelocity,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../../internal/PhysicalTolerance";

/**
 * A motor reads a chart joint's limits where the solver does: on the chart's
 * angles. The joint is a shoulder-like ball joint whose chart composes
 * abduction about z, flexion about y and twist about x, each axis free within
 * its own range.
 *
 * Scenarios:
 *
 * 1. Inside: at chart angles (1.2, 0.9, 0.4), each inside its range although the
 *    independent twist coordinate of y reads past its end, the solver's
 *    measurement finds no excess, a zero request projects to zero, the PD at
 *    its own target commands zero speed, and a request carrying y past its end
 *    within the substep is held to the rate that reaches that end from 0.9.
 * 2. Past: at chart angles (1.2, 1.1, 0.4), y 0.1 past its end, a zero request
 *    projects to the rate returning exactly the solver's measured excess over
 *    the substep, and to zero on the other axes.
 */
export function test_unit_engine_physics_physical_joint_chart(): void {
  const order: IAutoMoviePhysicalJointAxis["axis"][] = ["z", "y", "x"];
  const axis = (
    name: IAutoMoviePhysicalJointAxis["axis"],
    minimum: number,
    maximum: number,
  ): IAutoMoviePhysicalJointAxis => ({
    axis: name,
    minimum,
    maximum,
    stiffness: 50,
    damping: 5,
    maximumTorque: 100,
    channel: name,
  });
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const joint: IAutoMoviePhysicalJoint = {
    id: "shoulder",
    parent: "trunk",
    child: "arm",
    parentFrame: { position: { x: 0, y: 0, z: 0 }, rotation: identity },
    childFrame: { position: { x: 0, y: 0, z: 0 }, rotation: identity },
    axes: [axis("z", -2, 1.5), axis("y", -1, 1), axis("x", -0.5, 0.5)],
    order,
  };
  const dt: number = 1 / 3840;
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const failures: string[] = [];
  const rest: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion } =
    { position: zero, rotation: identity };

  // 1. Inside the chart box, past it in the independent reading.
  const inside: IAutoMovieQuaternion = AutoMoviePhysicalJointChart.compose(
    order,
    [1.2, 0.9, 0.4],
  );
  const twist: number = 2 * Math.atan2(inside.y, inside.w);
  if (!(twist > 1))
    failures.push(`the independent y reads ${twist}, not past its end`);
  const measured = measurePhysicalJointLimits(joint, rest, {
    position: zero,
    rotation: inside,
  });
  if (measured.some((c): boolean => c.violation > PhysicalTolerance.ROUNDING))
    failures.push(
      `the solver measures an excess inside: ${JSON.stringify(measured)}`,
    );
  const still: IAutoMovieVector3 = projectPhysicalJointVelocity(
    inside,
    joint.axes,
    zero,
    dt,
    order,
  );
  if (Math.hypot(still.x, still.y, still.z) > PhysicalTolerance.ACCUMULATED)
    failures.push(`a zero request inside projects to ${JSON.stringify(still)}`);
  const command = physicalJointMotorCommand({
    joint,
    current: inside,
    target: inside,
    velocity: zero,
    targetVelocity: zero,
    strength: 1,
    timestep: dt,
  });
  for (const commanded of command.axes)
    if (Math.abs(commanded.speed) > PhysicalTolerance.ACCUMULATED)
      failures.push(
        `the PD at its target commands ${commanded.speed} rad/s on ${commanded.axis}`,
      );
  const held: IAutoMovieVector3 = projectPhysicalJointVelocity(
    inside,
    joint.axes,
    { x: 0, y: 0.5 / dt, z: 0 },
    dt,
    order,
  );
  if (Math.abs(held.y * dt - 0.1) > PhysicalTolerance.ACCUMULATED)
    failures.push(
      `a request past y's end is held to ${held.y * dt} rad over the substep, not 0.1`,
    );

  // 2. Past the chart box on y.
  const past: IAutoMovieQuaternion = AutoMoviePhysicalJointChart.compose(
    order,
    [1.2, 1.1, 0.4],
  );
  const excess: number = measurePhysicalJointLimits(joint, rest, {
    position: zero,
    rotation: past,
  }).find((c): boolean => c.axis === "y")!.violation;
  const back: IAutoMovieVector3 = projectPhysicalJointVelocity(
    past,
    joint.axes,
    zero,
    dt,
    order,
  );
  if (Math.abs(excess - 0.1) > PhysicalTolerance.ACCUMULATED)
    failures.push(`the solver measures y's excess ${excess}, not 0.1`);
  if (Math.abs(back.y * dt + excess) > PhysicalTolerance.ACCUMULATED)
    failures.push(
      `a zero request past y's end returns ${-back.y * dt} rad, the solver's excess ${excess}`,
    );
  if (
    Math.abs(back.x) > PhysicalTolerance.ACCUMULATED ||
    Math.abs(back.z) > PhysicalTolerance.ACCUMULATED
  )
    failures.push(
      `a zero request past y's end moves the other axes: ${JSON.stringify(back)}`,
    );
  TestValidator.equals(
    "the motor reads the solver's chart limits",
    failures,
    [],
  );
}
