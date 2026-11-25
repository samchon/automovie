import {
  AutoMoviePhysicalJointChart,
  AutoMovieXpbdBody,
  AutoMovieXpbdJoint,
  AutoMovieXpbdWorld,
  Quaternion,
  Vector3,
  configurePhysicalJointMotor,
  physicalSupportPoint,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Light links under held joint motors converge with the substep: a synthetic
 * arm and finger, an upper arm on a ball joint charted abduction, flexion and
 * twist, a forearm, a hand and three phalanges of 25, 15 and 6.4 grams, hang
 * from a fixed base under gravity, every joint's motor reconfigured each
 * substep to hold its starting angles, as the world's tracking does. The
 * shoulder starts at chart angles (1.2, 0.9, 0.4), inside its box although
 * its independent twist coordinate of flexion reads past that end.
 *
 * Scenarios, one 1/120 s frame at 32 and at 64 substeps, read eight times:
 *
 * 1. The phalanges' largest angular speed agrees between the two substeps
 *    within a tenth at every reading.
 * 2. Every joint's anchor gap stays under a micron and no larger at the finer
 *    substep.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the chain, its start, the motors and each condition.
 * @evidence contracts/development/testing.md#behavioral-verification Steps a real `AutoMovieXpbdWorld` substep by substep with motors set through `configurePhysicalJointMotor`, and reads the bodies' angular velocities and joint anchors.
 * @evidence contracts/development/testing.md#independent-expectations A substep refines a converged motion rather than changing it, so readings at h and h/2 agree; a micron is a thousandth of the millimetre the joint tests allow and a hard joint's gap shrinks with the substep.
 * @evidence contracts/development/testing.md#distinguishing-cases A motor reading the shoulder's limits in independent twist coordinates asks e / h of it every substep, spinning the phalanges up to tens of radians per second within the frame, differently at each substep, with gaps near a tenth of a millimetre; both scenarios fail.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on a synthetic seven-body chain, a few hundred substeps in milliseconds; no figure, compute call, viewer or file host.
 */
export function test_unit_engine_physics_xpbd_light_chain(): void {
  const coarse: IReading = frame(32);
  const fine: IReading = frame(64);
  const failures: string[] = [];
  coarse.spin.forEach((spin: number, i: number): void => {
    const other: number = fine.spin[i]!;
    if (Math.abs(spin - other) > 0.1 * Math.max(spin, other))
      failures.push(`reading ${i}: the finger turns ${spin} rad/s at 32 substeps, ${other} at 64`);
    const gap: number = coarse.gap[i]!;
    const finer: number = fine.gap[i]!;
    if (!(gap < 1e-6) || !(finer < 1e-6) || !(finer <= gap))
      failures.push(`reading ${i}: anchor gaps ${gap} m at 32 substeps, ${finer} m at 64`);
  });
  TestValidator.equals("light links converge with the substep", failures, []);
}

/** A frame's eight readings. */
interface IReading {
  /** The phalanges' largest angular speed, radians per second. */
  spin: number[];

  /** The largest joint anchor gap, metres. */
  gap: number[];
}

/** One link of the chain, its body frame at its proximal joint. */
interface ILink {
  name: string;
  length: number;
  mass: number;
  inertia: IAutoMovieVector3;
  axes: IAutoMoviePhysicalJointAxis[];
  order: IAutoMoviePhysicalJointAxis["axis"][];
  turn: number[];
}

/** Step the chain one 1/120 s frame at a number of substeps. */
function frame(substeps: number): IReading {
  const axis = (
    name: IAutoMoviePhysicalJointAxis["axis"],
    minimum: number,
    maximum: number,
    stiffness: number,
    damping: number,
  ): IAutoMoviePhysicalJointAxis => ({
    axis: name,
    minimum,
    maximum,
    stiffness,
    damping,
    maximumTorque: stiffness,
    channel: name,
  });
  const links: ILink[] = [
    {
      name: "upper",
      length: 0.3,
      mass: 2.1,
      inertia: { x: 0.002, y: 0.016, z: 0.016 },
      axes: [
        axis("z", -2, 1.5, 70, 10),
        axis("y", -1, 1, 70, 10),
        axis("x", -0.5, 0.5, 70, 10),
      ],
      order: ["z", "y", "x"],
      turn: [1.2, 0.9, 0.4],
    },
    {
      name: "fore",
      length: 0.25,
      mass: 1.2,
      inertia: { x: 0.001, y: 0.006, z: 0.006 },
      axes: [axis("z", 0, 2.5, 60, 4)],
      order: ["x", "y", "z"],
      turn: [0, 0, 0.3],
    },
    {
      name: "hand",
      length: 0.08,
      mass: 0.3,
      inertia: { x: 2e-4, y: 4e-4, z: 4e-4 },
      axes: [axis("z", -1.2, 1.4, 17, 0.5), axis("y", -0.5, 0.35, 17, 0.5)],
      order: ["x", "y", "z"],
      turn: [0, 0.1, 0.2],
    },
    {
      name: "proximal",
      length: 0.045,
      mass: 0.025,
      inertia: { x: 1e-6, y: 5e-6, z: 5e-6 },
      axes: [axis("z", -1.57, 0.78, 1.5, 0.02), axis("y", -0.52, 0.52, 1.5, 0.02)],
      order: ["x", "y", "z"],
      turn: [0, 0.1, 0.2],
    },
    {
      name: "intermediate",
      length: 0.028,
      mass: 0.015,
      inertia: { x: 5e-7, y: 1.5e-6, z: 1.5e-6 },
      axes: [axis("z", 0, 2, 0.75, 0.01)],
      order: ["x", "y", "z"],
      turn: [0, 0, 0],
    },
    {
      name: "distal",
      length: 0.02,
      mass: 0.0064,
      inertia: { x: 2.2e-7, y: 6.6e-7, z: 6.6e-7 },
      axes: [axis("z", -0.35, 1.57, 0.3, 0.004)],
      order: ["x", "y", "z"],
      turn: [0, 0, 0],
    },
  ];
  const world: AutoMovieXpbdWorld = new AutoMovieXpbdWorld({
    x: 0,
    y: -9.81,
    z: 0,
  });
  world.timestep = 1 / (120 * substeps);
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const bodies: AutoMovieXpbdBody[] = [
    world.createBody(false, { position: { x: 0, y: 0, z: 0 }, rotation: identity }),
  ];
  const joints: {
    joint: IAutoMoviePhysicalJoint;
    native: AutoMovieXpbdJoint;
    target: IAutoMovieQuaternion;
  }[] = [];
  let parent: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion } =
    { position: { x: 0, y: 0, z: 0 }, rotation: identity };
  let reach: number = 0;
  for (const link of links) {
    const relative: IAutoMovieQuaternion = AutoMoviePhysicalJointChart.compose(
      link.order,
      link.turn,
    );
    const pose: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion } =
      {
        position: physicalSupportPoint(parent, { x: reach, y: 0, z: 0 }),
        rotation: Quaternion.multiply(parent.rotation, relative),
      };
    const body: AutoMovieXpbdBody = world.createBody(true, pose);
    body.setMass(
      link.mass,
      { x: link.length / 2, y: 0, z: 0 },
      link.inertia,
      identity,
    );
    const joint: IAutoMoviePhysicalJoint = {
      id: link.name,
      parent: joints.at(-1)?.joint.child ?? "base",
      child: link.name,
      parentFrame: { position: { x: reach, y: 0, z: 0 }, rotation: identity },
      childFrame: { position: { x: 0, y: 0, z: 0 }, rotation: identity },
      axes: link.axes,
      order: link.order,
    };
    joints.push({
      joint,
      native: world.createJoint(joint, bodies.at(-1)!, body),
      target: relative,
    });
    bodies.push(body);
    parent = pose;
    reach = link.length;
  }
  const reading: IReading = { spin: [], gap: [] };
  for (let substep: number = 1; substep <= substeps; substep++) {
    joints.forEach(({ joint, native, target }, index: number): void => {
      const above: AutoMovieXpbdBody = bodies[index]!;
      const below: AutoMovieXpbdBody = bodies[index + 1]!;
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(above.rotation());
      configurePhysicalJointMotor({
        world,
        native,
        joint,
        current: Quaternion.multiply(inverse, below.rotation()),
        target,
        velocity: Quaternion.rotateVector(
          inverse,
          Vector3.subtract(below.angvel(), above.angvel()),
        ),
        targetVelocity: { x: 0, y: 0, z: 0 },
        strength: 1,
      });
    });
    world.step();
    if (substep % (substeps / 8) !== 0) continue;
    reading.spin.push(
      Math.max(
        ...bodies
          .slice(4)
          .map((body: AutoMovieXpbdBody): number =>
            Vector3.length(body.angvel()),
          ),
      ),
    );
    reading.gap.push(
      Math.max(
        ...joints.map(({ joint }, index: number): number =>
          Vector3.length(
            Vector3.subtract(
              physicalSupportPoint(
                {
                  position: bodies[index]!.translation(),
                  rotation: bodies[index]!.rotation(),
                },
                joint.parentFrame.position,
              ),
              physicalSupportPoint(
                {
                  position: bodies[index + 1]!.translation(),
                  rotation: bodies[index + 1]!.rotation(),
                },
                joint.childFrame.position,
              ),
            ),
          ),
        ),
      ),
    );
  }
  return reading;
}
