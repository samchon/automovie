import {
  AutoMovieEngineXpbdBody,
  AutoMovieEngineXpbdJoint,
  AutoMovieEngineXpbdWorld,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Joint motors move whole articulations: one substep's motor impulse meets the
 * inertia of every body below the joint.
 *
 * Scenarios:
 *
 * 1. A shoulder motor on a two-link arm hanging from a fixed base, its elbow free,
 *    reaches the planar double pendulum's backward-Euler closed form `qd1 = h c
 *    s / (M11 - M12^2 / M22 + h c)` and `qd2 = -(M12 / M22) qd1` from rest in
 *    one substep.
 * 2. The same motor held at its torque cap gives the generalized impulse `tau h`
 *    on the shoulder alone: `qd = M^-1 (tau h, 0)`.
 * 3. On a free torso, shoulder and elbow motors driving opposite ways keep the
 *    system's linear and angular momentum at zero and both anchors together.
 */
export async function test_engine_physics_xpbd_articulated_motor(): Promise<void> {
  const findings: string[] = [];
  const h: number = 1 / 240;
  const m1: number = 2;
  const i1: number = 0.02;
  const c1: number = 0.15;
  const l1: number = 0.3;
  const m2: number = 1.5;
  const i2: number = 0.015;
  const c2: number = 0.12;
  const m11: number =
    i1 + m1 * c1 * c1 + i2 + m2 * (l1 * l1 + c2 * c2 + 2 * l1 * c2);
  const m12: number = i2 + m2 * (c2 * c2 + l1 * c2);
  const m22: number = i2 + m2 * c2 * c2;
  const tolerance: number = 1e-9;

  // 1. Free damper on a fixed base.
  {
    const damping: number = 50;
    const speed: number = 2;
    const arm: IArm = build(false);
    arm.shoulder.motors.set("z", { speed, damping, maximumTorque: 1000 });
    arm.world.step();
    const expected: number =
      (h * damping * speed) / (m11 - (m12 * m12) / m22 + h * damping);
    compare("damped shoulder", arm, expected, -(m12 / m22) * expected);
  }

  // 2. Capped motor on a fixed base.
  {
    const torque: number = 1;
    const arm: IArm = build(false);
    arm.shoulder.motors.set("z", {
      speed: 100,
      damping: 50,
      maximumTorque: torque,
    });
    arm.world.step();
    const det: number = m11 * m22 - m12 * m12;
    compare(
      "capped shoulder",
      arm,
      (torque * h * m22) / det,
      (-torque * h * m12) / det,
    );
  }

  // 3. Free torso: momentum and anchors.
  {
    const arm: IArm = build(true);
    arm.shoulder.motors.set("z", {
      speed: 2,
      damping: 50,
      maximumTorque: 1000,
    });
    arm.elbow.motors.set("z", { speed: -1, damping: 30, maximumTorque: 1000 });
    arm.world.step();
    const bodies: AutoMovieEngineXpbdBody[] = [arm.base, arm.upper, arm.fore];
    let linear: IAutoMovieVector3 = origin();
    let angular: IAutoMovieVector3 = origin();
    for (const body of bodies) {
      const momentum: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
        body.linvel(),
        body.mass(),
      );
      linear = AutoMovieEngineVector3.add(linear, momentum);
      angular = AutoMovieEngineVector3.add(
        angular,
        AutoMovieEngineVector3.add(
          body.worldInertia(body.angvel()),
          AutoMovieEngineVector3.cross(body.translation(), momentum),
        ),
      );
    }
    if (!(AutoMovieEngineVector3.length(linear) < tolerance))
      findings.push(`free torso linear momentum ${JSON.stringify(linear)}`);
    if (!(AutoMovieEngineVector3.length(angular) < tolerance))
      findings.push(`free torso angular momentum ${JSON.stringify(angular)}`);
    const shoulder: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      arm.upper.velocityAtPoint(origin()),
      arm.base.velocityAtPoint(origin()),
    );
    const elbowPoint: IAutoMovieVector3 = { x: 0, y: -l1, z: 0 };
    const elbow: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      arm.fore.velocityAtPoint(elbowPoint),
      arm.upper.velocityAtPoint(elbowPoint),
    );
    if (!(AutoMovieEngineVector3.length(shoulder) < tolerance))
      findings.push(`shoulder anchors part at ${AutoMovieEngineVector3.length(shoulder)} m/s`);
    if (!(AutoMovieEngineVector3.length(elbow) < tolerance))
      findings.push(`elbow anchors part at ${AutoMovieEngineVector3.length(elbow)} m/s`);
    if (!(arm.upper.angvel().z - arm.base.angvel().z > 0))
      findings.push("free shoulder does not turn toward its speed");
  }

  TestValidator.equals("motors move whole articulations", findings, []);

  /** Compare the shoulder's and elbow's relative angular velocities about z. */
  function compare(
    label: string,
    arm: IArm,
    shoulder: number,
    elbow: number,
  ): void {
    const q1: number = arm.upper.angvel().z - arm.base.angvel().z;
    const q2: number = arm.fore.angvel().z - arm.upper.angvel().z;
    if (!(Math.abs(q1 - shoulder) < tolerance * Math.abs(shoulder)))
      findings.push(`${label}: shoulder ${q1} rad/s, expected ${shoulder}`);
    if (!(Math.abs(q2 - elbow) < tolerance * Math.abs(elbow)))
      findings.push(`${label}: elbow ${q2} rad/s, expected ${elbow}`);
  }

  /** A gravity-free arm hanging along -y from a base at the origin. */
  function build(free: boolean): IArm {
    const world: AutoMovieEngineXpbdWorld = new AutoMovieEngineXpbdWorld(origin());
    world.timestep = h;
    const base: AutoMovieEngineXpbdBody = world.createBody(free, {
      position: origin(),
      rotation: identity(),
    });
    if (free)
      base.setMass(10, origin(), { x: 0.2, y: 0.2, z: 0.2 }, identity());
    const upper: AutoMovieEngineXpbdBody = world.createBody(true, {
      position: { x: 0, y: -c1, z: 0 },
      rotation: identity(),
    });
    upper.setMass(m1, origin(), { x: i1, y: 0.004, z: i1 }, identity());
    const fore: AutoMovieEngineXpbdBody = world.createBody(true, {
      position: { x: 0, y: -l1 - c2, z: 0 },
      rotation: identity(),
    });
    fore.setMass(m2, origin(), { x: i2, y: 0.003, z: i2 }, identity());
    const shoulder: AutoMovieEngineXpbdJoint = world.createJoint(
      ball("shoulder", "base", "upper", origin(), { x: 0, y: c1, z: 0 }),
      base,
      upper,
    );
    const elbow: AutoMovieEngineXpbdJoint = world.createJoint(
      ball(
        "elbow",
        "upper",
        "fore",
        { x: 0, y: -(l1 - c1), z: 0 },
        { x: 0, y: c2, z: 0 },
      ),
      upper,
      fore,
    );
    return { world, base, upper, fore, shoulder, elbow };
  }

  /** A three-axis joint with wide limits. */
  function ball(
    id: string,
    parent: string,
    child: string,
    parentAnchor: IAutoMovieVector3,
    childAnchor: IAutoMovieVector3,
  ): IAutoMoviePhysicalJoint {
    return {
      id,
      parent,
      child,
      parentFrame: { position: parentAnchor, rotation: identity() },
      childFrame: { position: childAnchor, rotation: identity() },
      axes: (["x", "y", "z"] as const).map(
        (name: "x" | "y" | "z"): IAutoMoviePhysicalJointAxis => ({
          axis: name,
          minimum: -3,
          maximum: 3,
          stiffness: 0,
          damping: 0,
          maximumTorque: 0,
          channel: name,
        }),
      ),
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

/** A two-link arm on a base. */
interface IArm {
  world: AutoMovieEngineXpbdWorld;
  base: AutoMovieEngineXpbdBody;
  upper: AutoMovieEngineXpbdBody;
  fore: AutoMovieEngineXpbdBody;
  shoulder: AutoMovieEngineXpbdJoint;
  elbow: AutoMovieEngineXpbdJoint;
}
