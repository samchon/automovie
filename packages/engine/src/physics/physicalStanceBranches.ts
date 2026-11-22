import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { RigidBody } from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalNativeVector } from "./physicalNativeVector";
import type { physicalStanceDynamics } from "./physicalStanceDynamics";

/**
 * The degrees of freedom outside a stance's legs, such as the spine and the
 * arms, as branches of the stance solve hanging from its base (#4017, rule 4).
 *
 * Every joint not owned by a stance leg is a degree of freedom of one tree
 * rooted at `root`, except a joint whose whole subtree is lighter than
 * `minimumMass` of the body (a digit), which rides its parent link rigidly.
 * The tree's resultant on the base and its joint torques come from a
 * recursive Newton-Euler pass over the tree (Featherstone 2008, Section 5.3).
 * The posture task is TSID Talos's, q'' = kp (q_ref - q) - kd q' with kp = 1
 * s^-2, kd = 2 sqrt(kp) and weight 0.1 (TSID talos_conf.py), q_ref being the
 * authored relative rotation and the error measured as the joint motors
 * measure theirs (`physicalJointMotorCommand`). The solved torques reach each
 * joint's implicit velocity motor as feed-forward, the way that motor adds a
 * torque to its PD, so `refresh` recomputes them at the present state from
 * the solved accelerations every substep.
 *
 * @param input The body, its native segments, the stance legs' segments, the
 *   root, the authored poses and gravity.
 * @returns The base (the root and the segments riding it rigidly), the
 *   branches, their degrees of freedom and the per-substep torque refresh.
 */
export function physicalStanceBranches(
  input: physicalStanceBranches.IInput,
): physicalStanceBranches.IResult {
  const total: number = input.profile.segments.reduce(
    (sum: number, segment) => sum + segment.mass,
    0,
  );
  const threshold: number = (input.minimumMass ?? 0.003) * total;
  const children: Map<string, IAutoMoviePhysicalJoint[]> = new Map();
  for (const joint of input.profile.joints) {
    const list: IAutoMoviePhysicalJoint[] = children.get(joint.parent) ?? [];
    list.push(joint);
    children.set(joint.parent, list);
  }
  const masses: Map<string, number> = new Map(
    input.profile.segments.map((segment) => [segment.bone, segment.mass]),
  );
  const subtree = (bone: string): number =>
    (masses.get(bone) ?? 0) +
    (children.get(bone) ?? []).reduce(
      (sum: number, joint: IAutoMoviePhysicalJoint): number =>
        sum + subtree(joint.child),
      0,
    );

  // Walk the tree from the root: an articulated joint opens a link; a light
  // subtree's segments ride the link they hang from.
  const links: physicalStanceBranches.ILink[] = [];
  const joints: IAutoMoviePhysicalJoint[] = [];
  const baseParts: physicalStanceDynamics.IBody[] = [
    rigidBody(input.segments.get(input.root)!),
  ];
  const ride = (bone: string, link: number): void => {
    const body: physicalStanceDynamics.IBody = rigidBody(
      input.segments.get(bone)!,
    );
    if (link < 0) baseParts.push(body);
    else links[link]!.bodies.push(body);
    for (const joint of children.get(bone) ?? []) {
      if (input.members.has(joint.child)) continue;
      visit(joint, link);
    }
  };
  const visit = (joint: IAutoMoviePhysicalJoint, parent: number): void => {
    if (subtree(joint.child) < threshold) {
      ride(joint.child, parent);
      return;
    }
    const parentBody: RigidBody = input.segments.get(joint.parent)!;
    const frame: IAutoMovieQuaternion = Quaternion.multiply(
      parentBody.rotation(),
      joint.parentFrame.rotation,
    );
    links.push({
      parent,
      pivot: Vector3.add(
        physicalNativeVector(parentBody.translation()),
        Quaternion.rotateVector(
          parentBody.rotation(),
          joint.parentFrame.position,
        ),
      ),
      axes: joint.axes.map(
        (axis): IAutoMovieVector3 =>
          Quaternion.rotateVector(frame, unit(axis.axis)),
      ),
      bodies: [],
    });
    joints.push(joint);
    ride(joint.child, links.length - 1);
  };
  for (const joint of children.get(input.root) ?? [])
    if (!input.members.has(joint.child)) visit(joint, -1);

  const base: physicalStanceDynamics.IBody = lump(
    baseParts,
    baseParts[0]!.velocity,
    baseParts[0]!.angular,
  );
  const tree: physicalStanceBranches.ITree = { links };
  const size: number = links.reduce(
    (sum: number, link) => sum + link.axes.length,
    0,
  );

  // Posture rows and torque bounds, in degree-of-freedom order.
  const posture: { weights: number[]; target: number }[] = [];
  const bounds: { lower: number; upper: number }[] = [];
  let column: number = 0;
  for (const joint of joints) {
    const parent: RigidBody = input.segments.get(joint.parent)!;
    const child: RigidBody = input.segments.get(joint.child)!;
    const parentFrame: IAutoMovieQuaternion = Quaternion.multiply(
      parent.rotation(),
      joint.parentFrame.rotation,
    );
    const current: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(parentFrame),
      Quaternion.multiply(child.rotation(), joint.childFrame.rotation),
    );
    const parentPose: IAutoMovieRigidTransform | undefined =
      input.targets[joint.parent];
    const childPose: IAutoMovieRigidTransform | undefined =
      input.targets[joint.child];
    const target: IAutoMovieQuaternion =
      parentPose && childPose
        ? Quaternion.multiply(
            Quaternion.inverse(
              Quaternion.multiply(
                parentPose.rotation,
                joint.parentFrame.rotation,
              ),
            ),
            Quaternion.multiply(childPose.rotation, joint.childFrame.rotation),
          )
        : current;
    const error: IAutoMovieVector3 = rotationVector(
      Quaternion.multiply(target, Quaternion.inverse(current)),
    );
    const rate: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(parentFrame),
      Vector3.subtract(
        physicalNativeVector(child.angvel()),
        physicalNativeVector(parent.angvel()),
      ),
    );
    for (const axis of joint.axes) {
      const weights: number[] = new Array<number>(size).fill(0);
      weights[column] = 1;
      posture.push({
        weights,
        target:
          physicalStanceBranches.STIFFNESS * error[axis.axis] -
          physicalStanceBranches.DAMPING * rate[axis.axis],
      });
      bounds.push({
        lower: -(axis.reverseTorque ?? axis.maximumTorque),
        upper: axis.maximumTorque,
      });
      column++;
    }
  }

  const branches: physicalStanceDynamics.IBranches = {
    size,
    evaluate: (request) => physicalStanceBranches.evaluate(tree, base, request),
    posture,
    weight: physicalStanceBranches.WEIGHT,
    bounds,
  };
  return {
    base,
    branches,
    joints: joints.map((joint: IAutoMoviePhysicalJoint) => ({
      id: joint.id,
      axes: joint.axes.map((axis) => axis.axis),
    })),
    refresh: (solution: {
      base: readonly number[];
      acceleration: readonly number[];
    }): number[] =>
      physicalStanceBranches.evaluate(tree, base, {
        linear: {
          x: solution.base[0]!,
          y: solution.base[1]!,
          z: solution.base[2]!,
        },
        angular: {
          x: solution.base[3]!,
          y: solution.base[4]!,
          z: solution.base[5]!,
        },
        acceleration: solution.acceleration,
        moving: true,
        gravity: input.gravity,
      }).torque,
  };
}
export namespace physicalStanceBranches {
  /** TSID Talos's posture gain, s^-2. */
  export const STIFFNESS: number = 1;
  /** Its critical damping, 2 sqrt(kp), s^-1. */
  export const DAMPING: number = 2;
  /** Its weight. */
  export const WEIGHT: number = 0.1;

  /** The branches' problem. */
  export interface IInput {
    /** The body's profile. */
    profile: IAutoMoviePhysicalProfile;
    /** Its native segments by bone. */
    segments: ReadonlyMap<string, RigidBody>;
    /** The segments the stance legs own; never a branch. */
    members: ReadonlySet<string>;
    /** The base segment the legs and the branches hang from. */
    root: string;
    /** The authored poses by bone: the posture reference. */
    targets: Readonly<Record<string, IAutoMovieRigidTransform>>;
    /** Gravity, metres per second squared. */
    gravity: IAutoMovieVector3;
    /** The share of the body's mass below which a joint's subtree rides its parent rigidly; 0.003 when absent. */
    minimumMass?: number;
  }

  /** The branches and their base. */
  export interface IResult {
    /** The root and the segments riding it rigidly, as one body. */
    base: physicalStanceDynamics.IBody;
    /** The branches for the stance solve. */
    branches: physicalStanceDynamics.IBranches;
    /** The articulated joints and their axes: the degree-of-freedom order. */
    joints: { id: string; axes: ("x" | "y" | "z")[] }[];
    /** The joint torques at the present state for the solved base and branch accelerations, in degree-of-freedom order. */
    refresh(solution: {
      base: readonly number[];
      acceleration: readonly number[];
    }): number[];
  }

  /** One link of the tree: its joint and the bodies it moves rigidly. */
  export interface ILink {
    /** The parent link's index, or -1 for the base. */
    parent: number;
    /** The joint centre, metres. */
    pivot: IAutoMovieVector3;
    /** The joint's world unit axes, each one degree of freedom. */
    axes: IAutoMovieVector3[];
    /** The link body first, then the bodies riding it. */
    bodies: physicalStanceDynamics.IBody[];
  }

  /** A tree of links, each after its parent. */
  export interface ITree {
    /** The links in parent-first order. */
    links: readonly ILink[];
  }

  /**
   * The tree's recursive Newton-Euler pass for the base's accelerations
   * (linear at `base.center`, angular) and the joint accelerations: the
   * force the base exerts on the tree, its moment about `base.center`, and
   * each joint's torque on its subtree. Without `moving`, velocities and
   * gravity are dropped.
   */
  export function evaluate(
    tree: ITree,
    base: physicalStanceDynamics.IBody,
    request: {
      linear: IAutoMovieVector3;
      angular: IAutoMovieVector3;
      acceleration: readonly number[];
      moving: boolean;
      gravity: IAutoMovieVector3;
    },
  ): { force: IAutoMovieVector3; moment: IAutoMovieVector3; torque: number[] } {
    const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const field: IAutoMovieVector3 = request.moving ? request.gravity : zero;
    const spin = (body: physicalStanceDynamics.IBody): IAutoMovieVector3 =>
      request.moving ? body.angular : zero;
    const offsets: number[] = [];
    let count: number = 0;
    for (const link of tree.links) {
      offsets.push(count);
      count += link.axes.length;
    }
    // Forward: each link's angular acceleration and its pivot's acceleration.
    const state: {
      omega: IAutoMovieVector3;
      alpha: IAutoMovieVector3;
      center: IAutoMovieVector3;
      linear: IAutoMovieVector3;
    }[] = [];
    const root = {
      omega: spin(base),
      alpha: request.angular,
      center: base.center,
      linear: request.linear,
    };
    const accelerations: IAutoMovieVector3[][] = [];
    tree.links.forEach((link: ILink, index: number): void => {
      const parent = link.parent < 0 ? root : state[link.parent]!;
      const omega: IAutoMovieVector3 = spin(link.bodies[0]!);
      let alpha: IAutoMovieVector3 = Vector3.add(
        parent.alpha,
        Vector3.cross(parent.omega, Vector3.subtract(omega, parent.omega)),
      );
      link.axes.forEach((axis: IAutoMovieVector3, k: number): void => {
        alpha = Vector3.add(
          alpha,
          Vector3.scale(axis, request.acceleration[offsets[index]! + k]!),
        );
      });
      const toPivot: IAutoMovieVector3 = Vector3.subtract(
        link.pivot,
        parent.center,
      );
      const pivot: IAutoMovieVector3 = Vector3.add(
        parent.linear,
        Vector3.add(
          Vector3.cross(parent.alpha, toPivot),
          Vector3.cross(parent.omega, Vector3.cross(parent.omega, toPivot)),
        ),
      );
      accelerations.push(
        link.bodies.map((body): IAutoMovieVector3 => {
          const arm: IAutoMovieVector3 = Vector3.subtract(
            body.center,
            link.pivot,
          );
          return Vector3.add(
            pivot,
            Vector3.add(
              Vector3.cross(alpha, arm),
              Vector3.cross(omega, Vector3.cross(omega, arm)),
            ),
          );
        }),
      );
      state.push({
        omega,
        alpha,
        center: link.bodies[0]!.center,
        linear: accelerations[index]![0]!,
      });
    });
    // Backward: each link's wrench on its subtree about its pivot.
    const forces: IAutoMovieVector3[] = tree.links.map(() => zero);
    const moments: IAutoMovieVector3[] = tree.links.map(() => zero);
    const torque: number[] = new Array<number>(count).fill(0);
    let force: IAutoMovieVector3 = zero;
    let moment: IAutoMovieVector3 = zero;
    for (let index: number = tree.links.length - 1; index >= 0; index--) {
      const link: ILink = tree.links[index]!;
      const { omega, alpha } = state[index]!;
      let f: IAutoMovieVector3 = forces[index]!;
      let m: IAutoMovieVector3 = moments[index]!;
      link.bodies.forEach((body, at: number): void => {
        const inertial: IAutoMovieVector3 = Vector3.scale(
          Vector3.subtract(accelerations[index]![at]!, field),
          body.mass,
        );
        f = Vector3.add(f, inertial);
        m = Vector3.add(
          m,
          Vector3.add(
            Vector3.add(
              apply(body.inertia, alpha),
              Vector3.cross(omega, apply(body.inertia, omega)),
            ),
            Vector3.cross(Vector3.subtract(body.center, link.pivot), inertial),
          ),
        );
      });
      link.axes.forEach((axis: IAutoMovieVector3, k: number): void => {
        torque[offsets[index]! + k] = Vector3.dot(axis, m);
      });
      // Carry the subtree's wrench to the parent's pivot, or to the base.
      const anchor: IAutoMovieVector3 =
        link.parent < 0 ? base.center : tree.links[link.parent]!.pivot;
      const carried: IAutoMovieVector3 = Vector3.add(
        m,
        Vector3.cross(Vector3.subtract(link.pivot, anchor), f),
      );
      if (link.parent < 0) {
        force = Vector3.add(force, f);
        moment = Vector3.add(moment, carried);
      } else {
        forces[link.parent] = Vector3.add(forces[link.parent]!, f);
        moments[link.parent] = Vector3.add(moments[link.parent]!, carried);
      }
    }
    return { force, moment, torque };
  }

  /**
   * The tree's joint-space mass matrix with the base held still, by the
   * composite-rigid-body algorithm (Featherstone 2008, Section 6.2): M_kl =
   * a_k . (N_l + (r_l - r_k) x F_l) where axis k is on the path from the
   * base to axis l, and zero between axes on different branches.
   */
  export function mass(tree: ITree): number[][] {
    const axes: { link: number; axis: IAutoMovieVector3 }[] = [];
    tree.links.forEach((link: ILink, index: number): void => {
      for (const axis of link.axes) axes.push({ link: index, axis });
    });
    const ancestors = (index: number): Set<number> => {
      const out: Set<number> = new Set();
      for (let at: number = index; at >= 0; at = tree.links[at]!.parent)
        out.add(at);
      return out;
    };
    const subtree = (index: number): physicalStanceDynamics.IBody[] => [
      ...tree.links[index]!.bodies,
      ...tree.links.flatMap((link: ILink, at: number) =>
        link.parent === index ? subtree(at) : [],
      ),
    ];
    const n: number = axes.length;
    const result: number[][] = Array.from({ length: n }, (): number[] =>
      new Array<number>(n).fill(0),
    );
    for (let l: number = 0; l < n; l++) {
      const { link, axis } = axes[l]!;
      const pivot: IAutoMovieVector3 = tree.links[link]!.pivot;
      let force: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      let moment: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      for (const body of subtree(link)) {
        const arm: IAutoMovieVector3 = Vector3.subtract(body.center, pivot);
        const linear: IAutoMovieVector3 = Vector3.cross(axis, arm);
        force = Vector3.add(force, Vector3.scale(linear, body.mass));
        moment = Vector3.add(
          moment,
          Vector3.add(
            apply(body.inertia, axis),
            Vector3.cross(arm, Vector3.scale(linear, body.mass)),
          ),
        );
      }
      const path: Set<number> = ancestors(link);
      for (let k: number = 0; k < n; k++) {
        if (!path.has(axes[k]!.link) || (axes[k]!.link === link && k > l))
          continue;
        const other: IAutoMovieVector3 = tree.links[axes[k]!.link]!.pivot;
        const value: number = Vector3.dot(
          axes[k]!.axis,
          Vector3.add(
            moment,
            Vector3.cross(Vector3.subtract(pivot, other), force),
          ),
        );
        result[k]![l] = value;
        result[l]![k] = value;
      }
    }
    return result;
  }
}

/** One native segment's mass, centre, world inertia and velocities. */
function rigidBody(rigid: RigidBody): physicalStanceDynamics.IBody {
  const frame: IAutoMovieQuaternion = Quaternion.multiply(
    rigid.rotation(),
    rigid.principalInertiaLocalFrame(),
  );
  const principal: IAutoMovieVector3 = physicalNativeVector(
    rigid.principalInertia(),
  );
  const columns: IAutoMovieVector3[] = [unit("x"), unit("y"), unit("z")].map(
    (axis: IAutoMovieVector3): IAutoMovieVector3 => {
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(frame),
        axis,
      );
      return Quaternion.rotateVector(frame, {
        x: principal.x * local.x,
        y: principal.y * local.y,
        z: principal.z * local.z,
      });
    },
  );
  return {
    mass: rigid.mass(),
    center: physicalNativeVector(rigid.worldCom()),
    inertia: [
      columns[0]!.x,
      columns[1]!.x,
      columns[2]!.x,
      columns[0]!.y,
      columns[1]!.y,
      columns[2]!.y,
      columns[0]!.z,
      columns[1]!.z,
      columns[2]!.z,
    ],
    velocity: physicalNativeVector(rigid.linvel()),
    angular: physicalNativeVector(rigid.angvel()),
  };
}

/** Bodies moving rigidly together as one body about their joint centre of mass (parallel axes). */
function lump(
  parts: readonly physicalStanceDynamics.IBody[],
  velocity: IAutoMovieVector3,
  angular: IAutoMovieVector3,
): physicalStanceDynamics.IBody {
  if (parts.length === 1) return parts[0]!;
  const mass: number = parts.reduce((sum: number, part) => sum + part.mass, 0);
  const center: IAutoMovieVector3 = Vector3.scale(
    parts.reduce(
      (sum: IAutoMovieVector3, part): IAutoMovieVector3 =>
        Vector3.add(sum, Vector3.scale(part.center, part.mass)),
      { x: 0, y: 0, z: 0 },
    ),
    1 / mass,
  );
  const inertia: number[] = new Array<number>(9).fill(0);
  for (const part of parts) {
    const r: IAutoMovieVector3 = Vector3.subtract(part.center, center);
    const v: number[] = [r.x, r.y, r.z];
    const rr: number = Vector3.dot(r, r);
    for (let a: number = 0; a < 3; a++)
      for (let b: number = 0; b < 3; b++)
        inertia[3 * a + b]! +=
          part.inertia[3 * a + b]! +
          part.mass * ((a === b ? rr : 0) - v[a]! * v[b]!);
  }
  return { mass, center, inertia, velocity, angular };
}

/** The geodesic rotation vector of a rotation, on the short arc. */
function rotationVector(delta: IAutoMovieQuaternion): IAutoMovieVector3 {
  const norm: number = Math.hypot(delta.x, delta.y, delta.z);
  const sign: number = delta.w < 0 ? -1 : 1;
  const scale: number =
    norm < 1e-12
      ? 2 * sign
      : (2 * Math.atan2(norm, Math.abs(delta.w)) * sign) / norm;
  return { x: delta.x * scale, y: delta.y * scale, z: delta.z * scale };
}

/** A world unit axis. */
function unit(axis: "x" | "y" | "z"): IAutoMovieVector3 {
  return {
    x: axis === "x" ? 1 : 0,
    y: axis === "y" ? 1 : 0,
    z: axis === "z" ? 1 : 0,
  };
}

/** A row-major 3x3 matrix times a vector. */
function apply(
  matrix: readonly number[],
  v: IAutoMovieVector3,
): IAutoMovieVector3 {
  return {
    x: matrix[0]! * v.x + matrix[1]! * v.y + matrix[2]! * v.z,
    y: matrix[3]! * v.x + matrix[4]! * v.y + matrix[5]! * v.z,
    z: matrix[6]! * v.x + matrix[7]! * v.y + matrix[8]! * v.z,
  };
}
