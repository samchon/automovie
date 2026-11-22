import { Quaternion, Vector3, physicalStanceBranches } from "@automovie/engine";
import type { physicalStanceDynamics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { RigidBody } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The stance branches' tree recursion matches closed forms.
 *
 * Scenarios:
 * 1. One link swinging on a translating base: its joint torque is (Ic + m l^2) q'' + m l (sin t (a_y + g) + cos t a_x), and the base exerts m (a_com - g) on it, a_com = a + q'' l (cos t, sin t) - q'^2 l (sin t, -cos t), with moment Ic q'' + ((c - c_base) x F)_z about the base's centre.
 * 2. Two links hanging from the base as a T: each joint's torque ignores the other branch's acceleration, and the base's resultant is the sum of the two single-link Newton-Euler wrenches.
 * 3. A planar two-link arm built as a tree: its mass matrix (by `mass` and by unit accelerations of `evaluate`), gravity and Coriolis terms are Spong, Hutchinson and Vidyasagar 2006, Section 7.4: M11 = I1 + I2 + m1 lc1^2 + m2 (l1^2 + lc2^2 + 2 l1 lc2 cos q2), M12 = I2 + m2 (lc2^2 + l1 lc2 cos q2), M22 = I2 + m2 lc2^2; g1 = (m1 lc1 + m2 l1) g cos q1 + m2 lc2 g cos(q1 + q2), g2 = m2 lc2 g cos(q1 + q2); h1 = -m2 l1 lc2 sin q2 (2 q1' q2' + q2'^2), h2 = m2 l1 lc2 sin q2 q1'^2.
 * 4. The Human's branches assembled at rest at the authored pose: no leg or digit degree of freedom, the declared bounds, zero posture targets, the base carrying the branches' weight and its moment, the trunk being spine, chest, neck and head, and a target turned by delta asking 50^2 delta at weight 1 of the chest but 1 delta at weight 0.1 of the forearm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario's closed form.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `physicalStanceBranches.evaluate` and `physicalStanceBranches.mass` on in-memory trees, and `physicalStanceBranches` on the Human profile over resting native-segment doubles, and compares the torques, the base's resultant, the mass matrix, the chosen degrees of freedom and the posture rows. A wrong sign of the base's resultant, a moment taken about the wrong point, a branch coupled to its sibling, a missing velocity product, a mass term on the wrong path, a leg or digit taken as a branch, or a trunk or limb posture at the wrong gain or weight fails.
 * @evidence contracts/development/testing.md#independent-expectations Scenario 1 is one rigid body's Newton-Euler written by hand, scenario 2 its sum over two independent bodies, scenario 3 the textbook two-link arm; scenario 4 takes the branches' weight and moment from the profile's segment masses and centres, and the posture targets from the stated law, kp delta for a target turned by delta. None reuses the recursion. The 1e-9 allowance covers float64 rounding of these sums.
 * @evidence contracts/development/testing.md#distinguishing-cases A tilted pendulum with a joint rate and a base acceleration on two axes separates the gravity, base and velocity terms; the T separates sibling branches from a chain; the bent elbow with nonzero rates separates the configuration-dependent mass terms and the velocity products; the turned chest and forearm separate the trunk's posture from a limb's. The stance solve itself belongs to the stance tests.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory, entered through the discoverable function `test_physical_stance_branches_tree`; no native world, viewer or file host.
 */
export function test_physical_stance_branches_tree(): void {
  const findings: string[] = [];
  const g: number = 9.81;
  const gravity: IAutoMovieVector3 = { x: 0, y: -g, z: 0 };
  const z: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const still: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const diagonal = (x: number, y: number, w: number): number[] => [
    x,
    0,
    0,
    0,
    y,
    0,
    0,
    0,
    w,
  ];
  const body = (
    mass: number,
    center: IAutoMovieVector3,
    izz: number,
    angular: IAutoMovieVector3 = still,
  ): physicalStanceDynamics.IBody => ({
    mass,
    center,
    inertia: diagonal(0.01, 0.01, izz),
    velocity: still,
    angular,
  });
  const close = (label: string, actual: number, expected: number): void => {
    if (!(Math.abs(actual - expected) < 1e-9))
      findings.push(`${label}: ${actual} instead of ${expected}`);
  };
  const base: physicalStanceDynamics.IBody = body(5, { x: 0, y: 1, z: 0 }, 0.2);

  // 1. A pendulum on a translating base.
  {
    const [m, l, t, ic, rate, accel] = [2, 0.3, 0.6, 0.02, 1.2, 0.7];
    const a: IAutoMovieVector3 = { x: 1.5, y: 0.4, z: 0 };
    const pivot: IAutoMovieVector3 = { x: 0.2, y: 1.1, z: 0 };
    const arm: IAutoMovieVector3 = {
      x: l * Math.sin(t),
      y: -l * Math.cos(t),
      z: 0,
    };
    const center: IAutoMovieVector3 = Vector3.add(pivot, arm);
    const tree: physicalStanceBranches.ITree = {
      links: [
        {
          parent: -1,
          pivot,
          axes: [z],
          bodies: [body(m, center, ic, Vector3.scale(z, rate))],
        },
      ],
    };
    const result = physicalStanceBranches.evaluate(tree, base, {
      linear: a,
      angular: still,
      acceleration: [accel],
      moving: true,
      gravity,
    });
    close(
      "pendulum torque",
      result.torque[0]!,
      (ic + m * l * l) * accel +
        m * l * (Math.sin(t) * (a.y + g) + Math.cos(t) * a.x),
    );
    const acom: IAutoMovieVector3 = {
      x: a.x + accel * l * Math.cos(t) - rate * rate * l * Math.sin(t),
      y: a.y + accel * l * Math.sin(t) + rate * rate * l * Math.cos(t),
      z: 0,
    };
    const force: IAutoMovieVector3 = {
      x: m * acom.x,
      y: m * (acom.y + g),
      z: 0,
    };
    close("pendulum force x", result.force.x, force.x);
    close("pendulum force y", result.force.y, force.y);
    close("pendulum force z", result.force.z, 0);
    const lever: IAutoMovieVector3 = Vector3.subtract(center, base.center);
    close(
      "pendulum moment z",
      result.moment.z,
      ic * accel + (lever.x * force.y - lever.y * force.x),
    );
    close("pendulum moment x", result.moment.x, 0);
  }

  // 2. A T: two single-body branches from the base.
  {
    const left: physicalStanceBranches.ILink = {
      parent: -1,
      pivot: { x: -0.2, y: 1.3, z: 0 },
      axes: [z],
      bodies: [body(1.5, { x: -0.45, y: 1.3, z: 0 }, 0.03)],
    };
    const right: physicalStanceBranches.ILink = {
      parent: -1,
      pivot: { x: 0.2, y: 1.3, z: 0 },
      axes: [z],
      bodies: [body(1.5, { x: 0.45, y: 1.25, z: 0 }, 0.03)],
    };
    const tree: physicalStanceBranches.ITree = { links: [left, right] };
    const run = (accelerations: number[]) =>
      physicalStanceBranches.evaluate(tree, base, {
        linear: still,
        angular: still,
        acceleration: accelerations,
        moving: true,
        gravity,
      });
    const quiet = run([0, 0]);
    const swung = run([3, 0]);
    close(
      "T right torque ignores the left branch",
      swung.torque[1]!,
      quiet.torque[1]!,
    );
    // Each branch alone: torque and wrench of one body hanging at rest.
    const single = (link: physicalStanceBranches.ILink, accel: number) => {
      const b = link.bodies[0]!;
      const r: IAutoMovieVector3 = Vector3.subtract(b.center, link.pivot);
      const acom: IAutoMovieVector3 = { x: -accel * r.y, y: accel * r.x, z: 0 };
      const force: IAutoMovieVector3 = {
        x: b.mass * acom.x,
        y: b.mass * (acom.y + g),
        z: 0,
      };
      const lever: IAutoMovieVector3 = Vector3.subtract(b.center, base.center);
      return {
        torque: 0.03 * accel + (r.x * force.y - r.y * force.x),
        force,
        moment: 0.03 * accel + (lever.x * force.y - lever.y * force.x),
      };
    };
    const a = single(left, 3);
    const b = single(right, 0);
    close("T left torque", swung.torque[0]!, a.torque);
    close("T right torque", swung.torque[1]!, b.torque);
    close("T force x", swung.force.x, a.force.x + b.force.x);
    close("T force y", swung.force.y, a.force.y + b.force.y);
    close("T moment z", swung.moment.z, a.moment + b.moment);
  }

  // 3. The planar two-link arm as a tree.
  {
    const [m1, m2, l1, lc1, lc2, I1, I2] = [3, 2, 0.5, 0.25, 0.2, 0.07, 0.03];
    const [q1, q2, w1, w2] = [0.4, 0.9, 1.3, -0.7];
    const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const elbow: IAutoMovieVector3 = {
      x: l1 * Math.cos(q1),
      y: l1 * Math.sin(q1),
      z: 0,
    };
    const arm = (moving: boolean): physicalStanceBranches.ITree => ({
      links: [
        {
          parent: -1,
          pivot: origin,
          axes: [z],
          bodies: [
            body(
              m1,
              { x: lc1 * Math.cos(q1), y: lc1 * Math.sin(q1), z: 0 },
              I1,
              moving ? Vector3.scale(z, w1) : still,
            ),
          ],
        },
        {
          parent: 0,
          pivot: elbow,
          axes: [z],
          bodies: [
            body(
              m2,
              {
                x: elbow.x + lc2 * Math.cos(q1 + q2),
                y: elbow.y + lc2 * Math.sin(q1 + q2),
                z: 0,
              },
              I2,
              moving ? Vector3.scale(z, w1 + w2) : still,
            ),
          ],
        },
      ],
    });
    const ground: physicalStanceDynamics.IBody = body(0, origin, 0);
    const M11: number =
      I1 +
      I2 +
      m1 * lc1 * lc1 +
      m2 * (l1 * l1 + lc2 * lc2 + 2 * l1 * lc2 * Math.cos(q2));
    const M12: number = I2 + m2 * (lc2 * lc2 + l1 * lc2 * Math.cos(q2));
    const M22: number = I2 + m2 * lc2 * lc2;
    const crba: number[][] = physicalStanceBranches.mass(arm(false));
    close("M11", crba[0]![0]!, M11);
    close("M12", crba[0]![1]!, M12);
    close("M21", crba[1]![0]!, M12);
    close("M22", crba[1]![1]!, M22);
    [
      [1, 0],
      [0, 1],
    ].forEach((unit: number[], column: number): void => {
      const torque: number[] = physicalStanceBranches.evaluate(
        arm(false),
        ground,
        {
          linear: still,
          angular: still,
          acceleration: unit,
          moving: false,
          gravity,
        },
      ).torque;
      close(`M column ${column} row 0`, torque[0]!, column === 0 ? M11 : M12);
      close(`M column ${column} row 1`, torque[1]!, column === 0 ? M12 : M22);
    });
    const bias = (field: IAutoMovieVector3, rates: boolean): number[] =>
      physicalStanceBranches.evaluate(arm(rates), ground, {
        linear: still,
        angular: still,
        acceleration: [0, 0],
        moving: true,
        gravity: field,
      }).torque;
    const weight: number[] = bias(gravity, false);
    close(
      "g1",
      weight[0]!,
      (m1 * lc1 + m2 * l1) * g * Math.cos(q1) +
        m2 * lc2 * g * Math.cos(q1 + q2),
    );
    close("g2", weight[1]!, m2 * lc2 * g * Math.cos(q1 + q2));
    const coriolis: number[] = bias(still, true);
    close(
      "h1",
      coriolis[0]!,
      -m2 * l1 * lc2 * Math.sin(q2) * (2 * w1 * w2 + w2 * w2),
    );
    close("h2", coriolis[1]!, m2 * l1 * lc2 * Math.sin(q2) * w1 * w1);
  }

  // 4. The Human's branches assembled at its neutral pose, standing still.
  {
    const profile: IAutoMoviePhysicalProfile =
      motionHumanBody("m-average").profile;
    const segments: Map<string, RigidBody> = new Map(
      profile.segments.map((segment: IAutoMoviePhysicalSegment) => [
        segment.bone,
        resting(segment),
      ]),
    );
    const members: Set<string> = new Set();
    const descend = (bone: string): void => {
      members.add(bone);
      for (const joint of profile.joints)
        if (joint.parent === bone) descend(joint.child);
    };
    for (const joint of profile.joints)
      if (/UpperLeg$/u.test(joint.child)) descend(joint.child);
    const targets: Record<string, IAutoMovieRigidTransform> =
      Object.fromEntries(
        profile.segments.map((segment: IAutoMoviePhysicalSegment) => [
          segment.bone,
          segment.neutral,
        ]),
      );
    const result: physicalStanceBranches.IResult = physicalStanceBranches({
      profile,
      segments,
      members,
      root: "hips",
      targets,
      gravity,
    });
    const childOf = (id: string): string =>
      profile.joints.find((joint: IAutoMoviePhysicalJoint) => joint.id === id)!
        .child;
    const children: string[] = result.joints.map((joint) => childOf(joint.id));
    for (const hand of ["leftHand", "rightHand", "chest", "head"])
      if (!children.includes(hand))
        findings.push(`no degree of freedom for ${hand}`);
    for (const child of children) {
      if (members.has(child))
        findings.push(`a stance leg's ${child} is a branch`);
      if (/(Thumb|Index|Middle|Ring|Little)/u.test(child))
        findings.push(`the digit ${child} is a branch`);
    }
    const declared = result.joints.flatMap((joint) => {
      const axes = profile.joints.find(
        (candidate: IAutoMoviePhysicalJoint) => candidate.id === joint.id,
      )!.axes;
      return joint.axes.map((name) => {
        const axis = axes.find((entry) => entry.axis === name)!;
        return {
          lower: -(axis.reverseTorque ?? axis.maximumTorque),
          upper: axis.maximumTorque,
        };
      });
    });
    TestValidator.equals(
      "bounds are the declared torques",
      result.branches.bounds,
      declared,
    );
    if (result.branches.size !== declared.length)
      findings.push(`size ${result.branches.size} for ${declared.length} axes`);
    for (const [k, row] of result.branches.posture.entries())
      close(`posture target ${k} at the authored pose`, row.target, 0);
    const rest = result.branches.evaluate({
      linear: still,
      angular: still,
      acceleration: new Array<number>(result.branches.size).fill(0),
      moving: true,
      gravity,
    });
    let weight: number = -result.base.mass * g;
    let moment: IAutoMovieVector3 = still;
    for (const segment of profile.segments) {
      if (members.has(segment.bone)) continue;
      const center: IAutoMovieVector3 = Vector3.add(
        segment.neutral.position,
        Quaternion.rotateVector(segment.neutral.rotation, segment.centerOfMass),
      );
      weight += segment.mass * g;
      moment = Vector3.add(
        moment,
        Vector3.cross(Vector3.subtract(center, result.base.center), {
          x: 0,
          y: segment.mass * g,
          z: 0,
        }),
      );
    }
    close("the base carries the branches' weight", rest.force.y, weight);
    close("no side force at rest x", rest.force.x, 0);
    close("no side force at rest z", rest.force.z, 0);
    close("their weight's moment x", rest.moment.x, moment.x);
    close("their weight's moment z", rest.moment.z, moment.z);

    // The trunk and the posture law: turn the chest's and the left forearm's
    // targets by delta about their first axis, in the joint's parent frame.
    TestValidator.equals(
      "the trunk is the axial chain",
      result.trunk.map(childOf),
      ["spine", "chest", "neck", "head"],
    );
    const delta: number = 0.05;
    const turned: Record<string, IAutoMovieRigidTransform> = { ...targets };
    const columnOf = (id: string): number => {
      let at: number = 0;
      for (const joint of result.joints) {
        if (joint.id === id) return at;
        at += joint.axes.length;
      }
      return -1;
    };
    const probes = (["chest", "leftLowerArm"] as const).map((bone) => {
      const joint: IAutoMoviePhysicalJoint = profile.joints.find(
        (candidate: IAutoMoviePhysicalJoint) => candidate.child === bone,
      )!;
      const axis = result.joints.find((entry) => entry.id === joint.id)!
        .axes[0]!;
      const frame: IAutoMovieQuaternion = Quaternion.multiply(
        targets[joint.parent]!.rotation,
        joint.parentFrame.rotation,
      );
      const spin: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        {
          x: axis === "x" ? 1 : 0,
          y: axis === "y" ? 1 : 0,
          z: axis === "z" ? 1 : 0,
        },
        (delta * 180) / Math.PI,
      );
      turned[bone] = {
        position: targets[bone]!.position,
        rotation: Quaternion.multiply(
          Quaternion.multiply(
            frame,
            Quaternion.multiply(spin, Quaternion.inverse(frame)),
          ),
          targets[bone]!.rotation,
        ),
      };
      return { bone, column: columnOf(joint.id) };
    });
    const posed: physicalStanceBranches.IResult = physicalStanceBranches({
      profile,
      segments,
      members,
      root: "hips",
      targets: turned,
      gravity,
    });
    for (const { bone, column } of probes) {
      const row = posed.branches.posture[column]!;
      const scale: number = row.weights[column]!;
      const trunk: boolean = bone === "chest";
      close(
        `${bone} posture acceleration`,
        row.target / scale,
        (trunk ? physicalStanceBranches.TRUNK_FREQUENCY ** 2 : 1) * delta,
      );
      close(
        `${bone} posture weight`,
        scale * scale * posed.branches.weight,
        trunk ? 1 : 0.1,
      );
    }
  }

  TestValidator.equals(
    "the tree recursion meets its closed forms",
    findings,
    [],
  );
}

/** A native segment at rest at its neutral pose: the reads the branches make. */
function resting(segment: IAutoMoviePhysicalSegment): RigidBody {
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const reads = {
    mass: (): number => segment.mass,
    translation: (): IAutoMovieVector3 => segment.neutral.position,
    rotation: (): IAutoMovieQuaternion => segment.neutral.rotation,
    worldCom: (): IAutoMovieVector3 =>
      Vector3.add(
        segment.neutral.position,
        Quaternion.rotateVector(segment.neutral.rotation, segment.centerOfMass),
      ),
    principalInertia: (): IAutoMovieVector3 => segment.inertia,
    principalInertiaLocalFrame: (): IAutoMovieQuaternion =>
      segment.inertiaRotation,
    linvel: (): IAutoMovieVector3 => zero,
    angvel: (): IAutoMovieVector3 => zero,
  };
  return reads as unknown as RigidBody;
}
