import type {
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { prepareLinearSystem } from "../math/prepareLinearSystem";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";
import { AutoMovieXpbdMath } from "./AutoMovieXpbdMath";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { PhysicalRotationVector } from "./PhysicalRotationVector";
import { limitPhysicalSwingTwist } from "./limitPhysicalSwingTwist";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
import { solveXpbdArticulation } from "./solveXpbdArticulation";
import type { solveXpbdContacts } from "./solveXpbdContacts";
import type { solveXpbdSupportCascade } from "./solveXpbdSupportCascade";

/**
 * The joint phase of one extended position-based dynamics step (Mueller,
 * Macklin, Chentanez, Jeschke and Kim 2020, section 3.3 and 3.4).
 *
 * `positions` closes each joint's anchor gap with a hard point constraint
 * solved as one 3x3 block, then turns the child toward the nearest admitted
 * rotation of its anchor frame relative to the parent's, again as one block:
 * the box of the profile's free axes, locked axes held at zero
 * (`projectPhysicalJointRotation`), and the clinical swing-twist limit where
 * the joint declares one (`limitPhysicalSwingTwist`). Solving each attachment's
 * rows together removes the whole linearized error in one correction, whatever
 * the inertia's anisotropy, where a scalar constraint along the error direction
 * converges only over passes. `motors` drives each free axis's relative angular
 * velocity toward its motor's speed by the backward-Euler damper `mu = h c (s -
 * v')`, capped at the motor's torque times the substep, over each whole
 * articulation (`solveXpbdArticulation`) so a motor meets the inertia of
 * everything it moves; a joint outside the forest solves its motors with its
 * own attachment's velocity rows.
 */
export namespace solveXpbdJoints {
  /**
   * One position pass over the joints.
   *
   * @param joints The joints, in creation order.
   */
  export function positions(joints: readonly AutoMovieXpbdJoint[]): void {
    for (const joint of joints) {
      const parent: AutoMovieXpbdBody = joint.parent;
      const child: AutoMovieXpbdBody = joint.child;
      if (!parent.dynamic && !child.dynamic) continue;

      // The anchors coincide.
      const pf: IAutoMovieRigidTransform = joint.parentFrame();
      const cf: IAutoMovieRigidTransform = joint.childFrame();
      const armP: IAutoMovieVector3 = anchorArm(parent, pf.position);
      const armC: IAutoMovieVector3 = anchorArm(child, cf.position);
      const gap: IAutoMovieVector3 = Vector3.subtract(
        Vector3.add(parent.center, armP),
        Vector3.add(child.center, armC),
      );
      if (Vector3.length(gap) > 0)
        AutoMovieXpbdMath.point(child, parent, gap, armC, armP);

      // The child's anchor frame turns into the admitted rotation.
      const base: IAutoMovieQuaternion = Quaternion.multiply(
        parent.orientation,
        pf.rotation,
      );
      const relative: IAutoMovieQuaternion = Quaternion.multiply(
        Quaternion.inverse(base),
        Quaternion.multiply(child.orientation, cf.rotation),
      );
      let admitted: IAutoMovieQuaternion = projectPhysicalJointRotation(
        joint.joint,
        relative,
      );
      if (joint.joint.swingTwist !== undefined)
        admitted = limitPhysicalSwingTwist(joint.joint.swingTwist, admitted);
      const correction: IAutoMovieVector3 = Quaternion.rotateVector(
        base,
        PhysicalRotationVector.log(
          Quaternion.multiply(admitted, Quaternion.inverse(relative)),
        ),
      );
      if (Vector3.length(correction) > 0)
        AutoMovieXpbdMath.rotation(child, parent, correction);
    }
  }

  /**
   * The velocity pass of the joints' motors. Every articulation's motors are
   * solved at once over its tree (`solveXpbdArticulation`). A joint outside the
   * forest (closing a loop, or with a kinematic child) has its motor rows
   * solved together with its own attachment's three velocity rows: unknowns are
   * the attachment impulse `p` and one angular impulse `mu_i` per motor axis
   * `a_i`, the attachment rows ask the anchors' relative velocity to vanish,
   * and each motor row is the backward-Euler damper `mu_i = h c_i (s_i - v_i')`
   * on the axis's relative angular velocity after the impulse, `v_i' + mu_i /
   * (h c_i) = s_i`. A motor whose impulse exceeds its cap `tau_i h` is held at
   * the cap and the rest re-solved.
   *
   * @param joints The joints, in creation order.
   * @param h The substep, seconds.
   * @param contacts The step's contacts, which hold each tree at its supports.
   * @param tasks The root tasks the trees' supports should meet, by root body.
   * @param warm Each tree's warm start for its supports' cascade, by root body,
   *   kept across steps.
   */
  export function motors(
    joints: readonly AutoMovieXpbdJoint[],
    h: number,
    contacts: readonly solveXpbdContacts.IContact[],
    tasks: ReadonlyMap<AutoMovieXpbdBody, AutoMovieXpbdWorld.IRootTask>,
    warm: Map<AutoMovieXpbdBody, solveXpbdSupportCascade.IWarm>,
  ): void {
    for (const joint of solveXpbdArticulation.motors(
      joints,
      h,
      contacts,
      tasks,
      warm,
    )) {
      const parent: AutoMovieXpbdBody = joint.parent;
      const child: AutoMovieXpbdBody = joint.child;
      if (!parent.dynamic && !child.dynamic) continue;
      const base: IAutoMovieQuaternion = Quaternion.multiply(
        parent.orientation,
        joint.parentFrame().rotation,
      );
      const rows: IMotorRow[] = [];
      for (const [name, motor] of joint.motors)
        if (motor.damping > 0 && motor.maximumTorque > 0)
          rows.push({
            axis: Quaternion.rotateVector(base, UNIT[name]!),
            motor,
            fixed: null,
          });
      if (rows.length === 0) continue;
      const pair: IPair = {
        parent,
        child,
        armP: anchorArm(parent, joint.parentFrame().position),
        armC: anchorArm(child, joint.childFrame().position),
      };

      // Present relative velocities: the anchors', then each motor axis's.
      const present: number[] = measure(pair, rows);
      // Each round holds at least one more motor at its cap, so at most
      // one round per motor follows the first.
      let solution: number[] | null = solveBlock(pair, rows, present, h);
      while (solution !== null && clamp(rows, solution, h))
        solution = solveBlock(pair, rows, present, h);
      if (solution === null) continue;
      const impulse: IImpulse = impulses(rows, solution);
      AutoMovieXpbdMath.impulse(
        child,
        parent,
        impulse.point,
        pair.armC,
        pair.armP,
      );
      AutoMovieXpbdMath.spin(child, parent, impulse.angular);
    }
  }

  /**
   * Hold every free motor whose impulse exceeds its cap at the cap; true when
   * any was newly held.
   */
  function clamp(
    rows: readonly IMotorRow[],
    solution: readonly number[],
    h: number,
  ): boolean {
    let clamped: boolean = false;
    rows.forEach((row: IMotorRow, index: number): void => {
      const cap: number = row.motor.maximumTorque * h;
      const mu: number = solution[3 + index]!;
      if (row.fixed === null && Math.abs(mu) > cap) {
        row.fixed = Math.sign(mu) * cap;
        clamped = true;
      }
    });
    return clamped;
  }

  /** One motor row of a joint's velocity block. */
  interface IMotorRow {
    /** The free axis in world space. */
    axis: IAutoMovieVector3;

    /** The axis's motor. */
    motor: AutoMovieXpbdJoint.IMotor;

    /** The impulse the row is held at once its cap binds, else null. */
    fixed: number | null;
  }

  /** The two bodies of a joint with their anchors' world arms. */
  interface IPair {
    parent: AutoMovieXpbdBody;
    child: AutoMovieXpbdBody;
    armP: IAutoMovieVector3;
    armC: IAutoMovieVector3;
  }

  /**
   * The anchors' relative velocity (child minus parent) and each axis's
   * relative angular velocity.
   */
  function measure(pair: IPair, rows: readonly IMotorRow[]): number[] {
    const u: IAutoMovieVector3 = Vector3.subtract(
      pair.child.velocityAtPoint(Vector3.add(pair.child.center, pair.armC)),
      pair.parent.velocityAtPoint(Vector3.add(pair.parent.center, pair.armP)),
    );
    const omega: IAutoMovieVector3 = Vector3.subtract(
      pair.child.angularVelocity,
      pair.parent.angularVelocity,
    );
    return [
      u.x,
      u.y,
      u.z,
      ...rows.map((row: IMotorRow): number => Vector3.dot(omega, row.axis)),
    ];
  }

  /**
   * A block solution's impulses on the child: the attachment's at its anchor
   * and the motors' summed angular one.
   */
  interface IImpulse {
    point: IAutoMovieVector3;
    angular: IAutoMovieVector3;
  }

  /**
   * Read the attachment impulse and the summed motor angular impulse from
   * unknowns `x`.
   */
  function impulses(
    rows: readonly IMotorRow[],
    x: readonly number[],
  ): IImpulse {
    let angular: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    rows.forEach((row: IMotorRow, index: number): void => {
      angular = Vector3.add(angular, Vector3.scale(row.axis, x[3 + index]!));
    });
    return { point: { x: x[0]!, y: x[1]!, z: x[2]! }, angular };
  }

  /**
   * The change of the measured velocities under unknowns `x`: the attachment
   * impulse on the child at its anchor, opposite on the parent, then one
   * angular impulse per axis.
   */
  function respond(
    pair: IPair,
    rows: readonly IMotorRow[],
    x: readonly number[],
  ): number[] {
    const impulse: IImpulse = impulses(rows, x);
    const c: IChange = change(pair.child, pair.armC, impulse, 1);
    const q: IChange = change(pair.parent, pair.armP, impulse, -1);
    const du: IAutoMovieVector3 = Vector3.subtract(c.linear, q.linear);
    const dw: IAutoMovieVector3 = Vector3.subtract(c.angular, q.angular);
    return [
      du.x,
      du.y,
      du.z,
      ...rows.map((row: IMotorRow): number => Vector3.dot(dw, row.axis)),
    ];
  }

  /** The velocity change of one body's anchor point and its rotation. */
  interface IChange {
    linear: IAutoMovieVector3;
    angular: IAutoMovieVector3;
  }

  /**
   * One body's anchor velocity and angular velocity change under the impulses,
   * taken with `sign`.
   */
  function change(
    body: AutoMovieXpbdBody,
    arm: IAutoMovieVector3,
    impulse: IImpulse,
    sign: number,
  ): IChange {
    if (!body.dynamic)
      return { linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } };
    const spin: IAutoMovieVector3 = Vector3.scale(
      body.frozenInverseInertia(
        Vector3.add(Vector3.cross(arm, impulse.point), impulse.angular),
      ),
      sign,
    );
    return {
      linear: Vector3.add(
        Vector3.scale(impulse.point, sign * body.inverseMass()),
        Vector3.cross(spin, arm),
      ),
      angular: spin,
    };
  }

  /**
   * Solve the joint's block: attachment rows `du = -u`, free motor rows `dv_i +
   * mu_i / (h c_i) = s_i - v_i`, held motor rows `mu_i = fixed`.
   */
  function solveBlock(
    pair: IPair,
    rows: readonly IMotorRow[],
    present: readonly number[],
    h: number,
  ): number[] | null {
    const size: number = 3 + rows.length;
    const columns: number[][] = [];
    for (let j: number = 0; j < size; ++j) {
      const unit: number[] = new Array<number>(size).fill(0);
      unit[j] = 1;
      columns.push(respond(pair, rows, unit));
    }
    const matrix: number[][] = [];
    const right: number[] = [];
    for (let i: number = 0; i < size; ++i) {
      const row: IMotorRow | undefined = i < 3 ? undefined : rows[i - 3];
      if (row !== undefined && row.fixed !== null) {
        matrix.push(
          Array.from({ length: size }, (_: unknown, j: number): number =>
            j === i ? 1 : 0,
          ),
        );
        right.push(row.fixed);
        continue;
      }
      matrix.push(
        Array.from(
          { length: size },
          (_: unknown, j: number): number =>
            columns[j]![i]! +
            (row !== undefined && j === i ? 1 / (h * row.motor.damping) : 0),
        ),
      );
      right.push(
        row === undefined ? -present[i]! : row.motor.speed - present[i]!,
      );
    }
    return prepareLinearSystem.solve(matrix, right);
  }

  /** A body-frame anchor's world arm from the body's centre. */
  function anchorArm(
    body: AutoMovieXpbdBody,
    anchor: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      body.orientation,
      Vector3.subtract(anchor, body.centerOfMass),
    );
  }

  /** Each joint-frame axis by name. */
  const UNIT: Readonly<Record<string, IAutoMovieVector3>> = {
    x: { x: 1, y: 0, z: 0 },
    y: { x: 0, y: 1, z: 0 },
    z: { x: 0, y: 0, z: 1 },
  };
}
