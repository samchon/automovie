import {
  AutoMovieXpbdBody,
  AutoMovieXpbdCollider,
  AutoMovieXpbdJoint,
  AutoMovieXpbdWorld,
  configurePhysicalJointMotor,
  solveXpbdArticulationContacts,
  solveXpbdContacts,
  solveXpbdSupportCascade,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A joint whose two directions differ in strength keeps both bounds through
 * every solve, so the support cascade may drive it the strong way even when its
 * own PD demand points the weak way (Herzog et al. 2016, Section 2.1: torque
 * bounds per direction).
 *
 * Scenarios:
 *
 * 1. Configuring a motor whose PD demand points the weak way leaves the native
 *    motor both declared bounds, not the demand direction's alone.
 * 2. A free motor on a link hanging from a fixed base, its speed far past either
 *    bound, is held at the bound of the direction it drives: the link turns at
 *    `tau h / (I + m c^2)` with tau the forward or the reverse cap.
 * 3. The support cascade over one held normal row coupled to one actuated axis,
 *    its task asking an impulse only the strong direction can give, reaches the
 *    task with the axis past the weak bound while a level-two motion row pulls
 *    it the weak way; the same program with both caps at the weak bound stops
 *    at it.
 *
 */
export function test_unit_engine_physics_xpbd_directional_motor_caps(): void {
  const findings: string[] = [];
  const h: number = 1 / 240;

  // 1. Both bounds survive a weak-way demand.
  {
    const link: ILink = hang(249, 94);
    configurePhysicalJointMotor({
      world: link.world,
      native: link.joint,
      joint: link.joint.joint,
      current: identity(),
      target: { x: 0, y: 0, z: -Math.sin(0.1), w: Math.cos(0.1) },
      velocity: origin(),
      targetVelocity: origin(),
      strength: 1,
    });
    const motor: AutoMovieXpbdJoint.IMotor | undefined =
      link.joint.motors.get("z");
    if (motor?.maximumTorque !== 249 || motor.reverseTorque !== 94)
      findings.push(`configured bounds ${JSON.stringify(motor)}`);
  }

  // 2. A free motor is held at its own direction's bound.
  for (const [speed, torque] of [
    [100, 1],
    [-100, -0.25],
  ] as const) {
    const link: ILink = hang(1, 0.25);
    link.joint.motors.set("z", {
      speed,
      damping: 50,
      maximumTorque: 1,
      reverseTorque: 0.25,
    });
    link.world.step();
    const expected: number = (torque * h) / (INERTIA + MASS * ARM * ARM);
    const actual: number = link.body.angvel().z;
    if (!(Math.abs(actual - expected) <= 1e-9 * Math.abs(expected)))
      findings.push(
        `free motor at ${speed}: ${actual} rad/s, expected ${expected}`,
      );
  }

  // 3. The cascade drives the axis the strong way.
  for (const [cap, reverse, expected] of [
    [10, 2, 5],
    [2, 2, 2],
  ] as const) {
    const x: number[] | null = solveXpbdSupportCascade(program(cap, reverse));
    if (x === null) findings.push(`cascade ${cap}/${reverse} has no solution`);
    else if (
      !(Math.abs(x[3]! - expected) < 1e-6) ||
      !(Math.abs(x[0]! - expected) < 1e-6)
    )
      findings.push(
        `cascade ${cap}/${reverse}: axis ${x[3]}, normal ${x[0]}, expected ${expected}`,
      );
  }

  TestValidator.equals("directional motor caps", findings, []);

  /**
   * A link of `MASS` hanging `ARM` below a fixed base on a ball joint, gravity
   * off.
   */
  function hang(forward: number, backward: number): ILink {
    const world: AutoMovieXpbdWorld = new AutoMovieXpbdWorld(origin());
    world.timestep = h;
    const base: AutoMovieXpbdBody = world.createBody(false, {
      position: origin(),
      rotation: identity(),
    });
    const body: AutoMovieXpbdBody = world.createBody(true, {
      position: { x: 0, y: -ARM, z: 0 },
      rotation: identity(),
    });
    body.setMass(
      MASS,
      origin(),
      { x: INERTIA, y: INERTIA / 4, z: INERTIA },
      identity(),
    );
    const joint: AutoMovieXpbdJoint = world.createJoint(
      {
        id: "pivot",
        parent: "base",
        child: "link",
        parentFrame: { position: origin(), rotation: identity() },
        childFrame: { position: { x: 0, y: ARM, z: 0 }, rotation: identity() },
        axes: (["x", "y", "z"] as const).map(
          (name: "x" | "y" | "z"): IAutoMoviePhysicalJointAxis => ({
            axis: name,
            minimum: -3,
            maximum: 3,
            stiffness: 100,
            damping: 10,
            maximumTorque: forward,
            reverseTorque: backward,
            channel: name,
          }),
        ),
      } satisfies IAutoMoviePhysicalJoint,
      base,
      body,
    );
    return { world, body, joint };
  }

  /**
   * One patch on the floor: a normal row whose velocity the axis's impulse
   * takes back one for one, and its two tangential rows, held at rest; the task
   * asks the normal for 5 N s, a motion row asks the axis for -1.
   */
  function program(
    cap: number,
    reverse: number,
  ): solveXpbdSupportCascade.IInput {
    const world: AutoMovieXpbdWorld = new AutoMovieXpbdWorld(origin());
    const floor: AutoMovieXpbdCollider = world.createCollider(
      world.createBody(false, { position: origin(), rotation: identity() }),
      {
        id: "floor",
        material: "floor",
        kind: "box",
        halfExtents: { x: 1, y: 0.1, z: 1 },
        transform: { position: origin(), rotation: identity() },
      },
      1,
      0,
      false,
    );
    const contact: solveXpbdContacts.IContact = {
      a: floor,
      b: floor,
      pair: 0,
      normal: { x: 0, y: 1, z: 0 },
      localA: origin(),
      localB: origin(),
      friction: 1,
      restitution: 0,
      normalLambda: 0,
      tangentLambda: origin(),
      tangentImpulse: 0,
      frictionImpulse: origin(),
      approach: 0,
      separation: 0,
      detected: 0,
      velocityImpulse: 0,
    };
    const row = (
      direction: IAutoMovieVector3,
      lower?: number,
    ): solveXpbdArticulationContacts.IRow => ({
      state: 1,
      point: origin(),
      direction,
      ...(lower !== undefined ? { lower } : {}),
      velocity: 0,
      contact,
    });
    return {
      k: [
        [1, 0, 0, -1],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
      ],
      u: [0, 0, 0],
      columns: [
        [0, 1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ],
      target: [0, 5, 0, 0, 0, 0],
      set: {
        rows: [
          row({ x: 0, y: 1, z: 0 }, 0),
          row({ x: 1, y: 0, z: 0 }),
          row({ x: 0, y: 0, z: 1 }),
        ],
        patches: [
          {
            friction: 1,
            normal: 0,
            prior: { first: 0, second: 0 },
            normals: [0],
            tangents: [1, 2],
          },
        ],
      },
      actuators: [{ edge: 0, axis: 2, cap, reverse }],
      motion: [{ weights: [0, 0, 0, 1], value: -1 }],
      warm: { first: [], second: [] },
    };
  }

  /** The zero vector. */
  function origin(): IAutoMovieVector3 {
    return { x: 0, y: 0, z: 0 };
  }

  /** The identity rotation. */
  function identity(): IAutoMovieQuaternion {
    return { x: 0, y: 0, z: 0, w: 1 };
  }
}

/** The hanging link's mass, kilograms. */
const MASS: number = 2;

/** Its centre's distance below the pivot, metres. */
const ARM: number = 0.2;

/**
 * Its principal moment about the horizontal axes through its centre, kilogram
 * square metres.
 */
const INERTIA: number = 0.02;

/** A link on a fixed base. */
interface ILink {
  world: AutoMovieXpbdWorld;
  body: AutoMovieXpbdBody;
  joint: AutoMovieXpbdJoint;
}
