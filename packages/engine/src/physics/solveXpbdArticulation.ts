import type {
  IAutoMoviePhysicalJointAxis,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { prepareLinearSystem } from "../math/prepareLinearSystem";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";

/**
 * The joint motors' velocity pass over whole articulations, by the
 * articulated-body algorithm (Featherstone 2008, "Rigid Body Dynamics
 * Algorithms", chapter 7) in its impulse form, in world-aligned spatial
 * coordinates (angular, linear) about each tree's root centre.
 *
 * The world's joints form a forest: a joint is a tree edge when its child
 * is dynamic, has no parent edge yet and lies in another tree than its
 * parent; a kinematic parent is a fixed base. Each edge's motion subspace
 * `S` is the rotation about its anchor along its profile's free axes. A
 * motor on axis `k` is the backward-Euler damper `mu_k = h c_k (s_k - qd_k')`
 * on the axis's relative angular velocity after the pass, which enters the
 * algorithm as the joint-space term `D = S^T I^A S + diag(h c)` with the
 * joint impulse `u = h c (s - qd) - S^T p^A`. One sweep from the leaves
 * gathers the articulated inertias and impulses, and one from the root
 * gives every body's velocity change, so each motor meets the inertia of
 * everything it really moves and every attachment's velocity is kept. A
 * motor whose impulse exceeds its cap `tau h` is held at the cap and the
 * tree swept again, at most once more per motor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the source, the forest rule, the subspace, the motor term and the cap.
 * @evidence contracts/development/design.md#principled-representation A namespace over the world's joints; impulses in newton seconds and newton metre seconds, velocities in metres and radians per second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One entry, called by solveXpbdJoints.motors, returning the joints it leaves to the pair solve.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Gains, caps and inertias are the motors' and the bodies'; nothing is tuned here.
 */
export namespace solveXpbdArticulation {
  /**
   * Solve every tree's motors at once and return the joints outside the
   * forest (closing a loop or with a kinematic child), which the caller
   * solves pair by pair.
   *
   * @param joints The world's joints, in creation order.
   * @param h The substep, seconds.
   * @returns The joints outside the forest, in creation order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is solved and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation Featherstone 2008, chapter 7: the articulated-body algorithm's inward sweep I^A = I - U D^-1 U^T, p^A = p + U D^-1 u and outward sweep qd = D^-1 (u - U^T v_parent), with the motors' implicit damping in D.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Build the forest, then per tree: rows, inward sweep, outward sweep, caps, apply.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A tree without an active motor is skipped; a singular joint or root inertia leaves its tree untouched instead of dividing.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each sweep is linear in the tree's bodies with constant 6x6 work per body, plus one more sweep pair per capped motor; the forest is built in joints times tree depth.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each substep reads the current poses and velocities; nothing carries over.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Mutates only the bodies' velocities; the forest and its rows are released at return.
   */
  export function motors(
    joints: readonly AutoMovieXpbdJoint[],
    h: number,
  ): AutoMovieXpbdJoint[] {
    const nodes: Map<AutoMovieXpbdBody, INode> = new Map();
    const loops: AutoMovieXpbdJoint[] = [];
    for (const joint of joints) {
      const child: INode = nodeOf(nodes, joint.child);
      const parent: INode = nodeOf(nodes, joint.parent);
      if (
        !joint.child.dynamic ||
        child.edge !== undefined ||
        root(child) === root(parent)
      ) {
        loops.push(joint);
        continue;
      }
      child.edge = joint;
      child.parent = parent;
      parent.children.push(child);
    }
    for (const node of nodes.values())
      if (node.parent === undefined) solveTree(node, h);
    return loops;
  }

  /** One body of the forest. */
  interface INode {
    body: AutoMovieXpbdBody;

    /** The joint to its parent; absent at a root. */
    edge?: AutoMovieXpbdJoint;

    /** Its parent node; absent at a root. */
    parent?: INode;
    children: INode[];
  }

  /** One body's spatial quantities for one tree solve. */
  interface IState {
    body: AutoMovieXpbdBody;

    /** Its own spatial inertia about the tree's origin, row-major 6x6. */
    own: number[];

    /** Articulated inertia `I^A`, row-major 6x6. */
    inertia: number[];

    /** Articulated impulse `p^A`. */
    bias: number[];

    /** Spatial velocity change. */
    change: number[];
  }

  /** A node waiting in the depth-first walk with its state. */
  interface IVisit {
    node: INode;
    state: IState;
  }

  /** One tree edge's rows for one solve. */
  interface IEdge {
    parent: IState;
    child: IState;
    axes: IAxis[];

    /** `D^-1 u` per axis. */
    drive: number[];
  }

  /** One free axis of an edge. */
  interface IAxis {
    /** Spatial motion column: unit rotation about the anchor. */
    column: number[];

    /** The axis's active motor; absent when none drives it. */
    motor?: AutoMovieXpbdJoint.IMotor;

    /** Present relative angular velocity about the axis. */
    present: number;

    /** The impulse once its cap holds the motor; absent while free. */
    fixed?: number;

    /** Implicit damping term `h c`; zero without a free motor. */
    damping: number;

    /** Joint impulse `b`: `h c (s - qd)` for a free motor, the cap for a held one. */
    impulse: number;

    /** `U = I^A S` column. */
    u: number[];

    /** Row of `D^-1 U^T`. */
    gain: number[];

    /** Relative angular velocity change found by the outward sweep. */
    rate: number;
  }

  /** The node of a body, created on first use. */
  function nodeOf(nodes: Map<AutoMovieXpbdBody, INode>, body: AutoMovieXpbdBody): INode {
    let found: INode | undefined = nodes.get(body);
    if (found === undefined) {
      found = { body, children: [] };
      nodes.set(body, found);
    }
    return found;
  }

  /** The node's root. */
  function root(node: INode): INode {
    let top: INode = node;
    while (top.parent !== undefined) top = top.parent;
    return top;
  }

  /** Solve one tree's motors, from its root. */
  function solveTree(top: INode, h: number): void {
    const origin: IAutoMovieVector3 = top.body.center;
    const base: IState = state(top.body, origin);
    const states: IState[] = [base];
    const edges: IEdge[] = [];
    // Depth-first from the root: every edge follows its parent's edge.
    const stack: IVisit[] = [{ node: top, state: base }];
    while (stack.length !== 0) {
      const visit: IVisit = stack.pop()!;
      for (const next of visit.node.children) {
        const child: IState = state(next.body, origin);
        states.push(child);
        edges.push({
          parent: visit.state,
          child,
          axes: axes(next.edge!, origin),
          drive: [],
        });
        stack.push({ node: next, state: child });
      }
    }
    if (
      !edges.some((entry: IEdge): boolean =>
        entry.axes.some((axis: IAxis): boolean => axis.motor !== undefined),
      )
    )
      return;
    do {
      if (!sweep(base, top.body.dynamic, states, edges, h)) return;
    } while (clamp(edges, h));
    for (const entry of states) {
      const body: AutoMovieXpbdBody = entry.body;
      if (!body.dynamic) continue;
      const spin: IAutoMovieVector3 = vector(entry.change, 0);
      body.angularVelocity = Vector3.add(body.angularVelocity, spin);
      body.velocity = Vector3.add(
        body.velocity,
        Vector3.add(
          vector(entry.change, 3),
          Vector3.cross(spin, Vector3.subtract(body.center, origin)),
        ),
      );
    }
  }

  /** A body's state with its own spatial inertia about the origin. */
  function state(body: AutoMovieXpbdBody, origin: IAutoMovieVector3): IState {
    const own: number[] = spatialInertia(body, origin);
    return {
      body,
      own,
      inertia: own,
      bias: ZERO,
      change: ZERO,
    };
  }

  /** An edge's free axes: columns, motors and present relative velocities. */
  function axes(joint: AutoMovieXpbdJoint, origin: IAutoMovieVector3): IAxis[] {
    const frame: IAutoMovieQuaternion = Quaternion.multiply(
      joint.parent.orientation,
      joint.parentFrame().rotation,
    );
    const anchor: IAutoMovieVector3 = Vector3.subtract(
      Vector3.add(
        joint.child.center,
        Quaternion.rotateVector(
          joint.child.orientation,
          Vector3.subtract(
            joint.childFrame().position,
            joint.child.centerOfMass,
          ),
        ),
      ),
      origin,
    );
    const relative: IAutoMovieVector3 = Vector3.subtract(
      joint.child.angularVelocity,
      joint.parent.angularVelocity,
    );
    return joint.joint.axes.map(
      (declared: IAutoMoviePhysicalJointAxis): IAxis => {
        const e: IAutoMovieVector3 = Quaternion.rotateVector(
          frame,
          UNIT[declared.axis]!,
        );
        const moment: IAutoMovieVector3 = Vector3.cross(anchor, e);
        const motor: AutoMovieXpbdJoint.IMotor | undefined = joint.motors.get(
          declared.axis,
        );
        return {
          column: [e.x, e.y, e.z, moment.x, moment.y, moment.z],
          motor:
            motor !== undefined && motor.damping > 0 && motor.maximumTorque > 0
              ? motor
              : undefined,
          present: Vector3.dot(relative, e),
          damping: 0,
          impulse: 0,
          u: [],
          gain: [],
          rate: 0,
        };
      },
    );
  }

  /** One inward and one outward sweep; false when an inertia is singular. */
  function sweep(
    base: IState,
    free: boolean,
    states: readonly IState[],
    edges: readonly IEdge[],
    h: number,
  ): boolean {
    for (const entry of states) {
      entry.inertia = entry.own;
      entry.bias = ZERO;
    }
    // Inward: children before parents.
    for (let index: number = edges.length - 1; index >= 0; --index) {
      const entry: IEdge = edges[index]!;
      const child: IState = entry.child;
      for (const axis of entry.axes) {
        axis.u = multiply(child.inertia, axis.column);
        axis.damping =
          axis.motor !== undefined && axis.fixed === undefined
            ? h * axis.motor.damping
            : 0;
        axis.impulse =
          axis.fixed ??
          (axis.motor !== undefined
            ? h * axis.motor.damping * (axis.motor.speed - axis.present)
            : 0);
      }
      const d: number[][] = entry.axes.map(
        (row: IAxis, k: number): number[] =>
          entry.axes.map(
            (column: IAxis, l: number): number =>
              dot(row.column, column.u) + (k === l ? row.damping : 0),
          ),
      );
      const solve: ((right: readonly number[]) => number[]) | null =
        entry.axes.length === 0
          ? (right: readonly number[]): number[] => [...right]
          : prepareLinearSystem(d);
      if (solve === null) return false;
      // Rows of D^-1 U^T, solved one spatial coordinate at a time.
      const columns: number[][] = [0, 1, 2, 3, 4, 5].map(
        (m: number): number[] =>
          solve(entry.axes.map((axis: IAxis): number => axis.u[m]!)),
      );
      entry.axes.forEach((axis: IAxis, k: number): void => {
        axis.gain = columns.map((column: number[]): number => column[k]!);
      });
      entry.drive = solve(
        entry.axes.map(
          (axis: IAxis): number => axis.impulse - dot(axis.column, child.bias),
        ),
      );
      const inertia: number[] = child.inertia.map(
        (value: number, cell: number): number => {
          const r: number = Math.floor(cell / 6);
          const m: number = cell % 6;
          let sum: number = value;
          for (const axis of entry.axes) sum -= axis.u[r]! * axis.gain[m]!;
          return sum;
        },
      );
      const bias: number[] = child.bias.map(
        (value: number, r: number): number => {
          let sum: number = value;
          entry.axes.forEach((axis: IAxis, k: number): void => {
            sum += axis.u[r]! * entry.drive[k]!;
          });
          return sum;
        },
      );
      entry.parent.inertia = add(entry.parent.inertia, inertia);
      entry.parent.bias = add(entry.parent.bias, bias);
    }

    // The root: a dynamic root is free; a kinematic one is the fixed base.
    if (free) {
      const change: number[] | null = prepareLinearSystem.solve(
        rows(base.inertia),
        base.bias.map((value: number): number => -value),
      );
      if (change === null) return false;
      base.change = change;
    } else base.change = ZERO;

    // Outward: parents before children.
    for (const entry of edges) {
      const from: number[] = entry.parent.change;
      entry.axes.forEach((axis: IAxis, k: number): void => {
        axis.rate = entry.drive[k]! - dot(axis.gain, from);
      });
      entry.child.change = from.map((value: number, r: number): number => {
        let sum: number = value;
        for (const axis of entry.axes) sum += axis.column[r]! * axis.rate;
        return sum;
      });
    }
    return true;
  }

  /**
   * Hold every free motor whose impulse `b - h c qd` exceeds its cap at the
   * cap; true when any was newly held.
   */
  function clamp(edges: readonly IEdge[], h: number): boolean {
    let clamped: boolean = false;
    for (const entry of edges)
      for (const axis of entry.axes) {
        if (axis.motor === undefined || axis.fixed !== undefined) continue;
        const mu: number = axis.impulse - axis.damping * axis.rate;
        const cap: number = axis.motor.maximumTorque * h;
        if (Math.abs(mu) > cap) {
          axis.fixed = Math.sign(mu) * cap;
          clamped = true;
        }
      }
    return clamped;
  }

  /**
   * A body's spatial inertia about `origin` in world axes, row-major 6x6
   * over (angular, linear): `[[I_c + m [c]x [c]x^T, m [c]x], [m [c]x^T, m E]]`
   * with `c` its centre relative to `origin` (Featherstone 2008, eq. 2.63);
   * zero for a kinematic body.
   */
  function spatialInertia(
    body: AutoMovieXpbdBody,
    origin: IAutoMovieVector3,
  ): number[] {
    const result: number[] = new Array<number>(36).fill(0);
    if (!body.dynamic) return result;
    const m: number = body.mass();
    const c: IAutoMovieVector3 = Vector3.subtract(body.center, origin);
    const offset: number[] = [c.x, c.y, c.z];
    const cross: number[] = [0, -c.z, c.y, c.z, 0, -c.x, -c.y, c.x, 0];
    for (let col: number = 0; col < 3; ++col) {
      const rotational: IAutoMovieVector3 = body.worldInertia(
        vector(IDENTITY, col * 3),
      );
      const values: number[] = [rotational.x, rotational.y, rotational.z];
      for (let row: number = 0; row < 3; ++row) {
        // [c]x [c]x^T = |c|^2 E - c c^T.
        const shift: number =
          (row === col ? Vector3.dot(c, c) : 0) - offset[row]! * offset[col]!;
        result[row * 6 + col] = values[row]! + m * shift;
        result[row * 6 + col + 3] = m * cross[row * 3 + col]!;
        result[(row + 3) * 6 + col] = m * cross[col * 3 + row]!;
        result[(row + 3) * 6 + col + 3] = row === col ? m : 0;
      }
    }
    return result;
  }

  /** A row-major 6x6 matrix times a 6-vector. */
  function multiply(matrix: readonly number[], v: readonly number[]): number[] {
    return [0, 1, 2, 3, 4, 5].map((r: number): number => {
      let sum: number = 0;
      for (let k: number = 0; k < 6; ++k) sum += matrix[r * 6 + k]! * v[k]!;
      return sum;
    });
  }

  /** Elementwise sum of two equal-length arrays. */
  function add(a: readonly number[], b: readonly number[]): number[] {
    return a.map((value: number, index: number): number => value + b[index]!);
  }

  /** A row-major 6x6 matrix as rows. */
  function rows(matrix: readonly number[]): number[][] {
    return [0, 1, 2, 3, 4, 5].map((r: number): number[] =>
      matrix.slice(r * 6, r * 6 + 6),
    );
  }

  /** The dot product of two equal-length arrays. */
  function dot(a: readonly number[], b: readonly number[]): number {
    let sum: number = 0;
    for (let k: number = 0; k < a.length; ++k) sum += a[k]! * b[k]!;
    return sum;
  }

  /** Three entries of an array from `offset`. */
  function vector(v: readonly number[], offset: number): IAutoMovieVector3 {
    return { x: v[offset]!, y: v[offset + 1]!, z: v[offset + 2]! };
  }

  /** The zero spatial vector; never mutated, every update builds a new array. */
  const ZERO: number[] = [0, 0, 0, 0, 0, 0];

  /** The 3x3 identity's columns, concatenated. */
  const IDENTITY: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  /** Each joint-frame axis by name. */
  const UNIT: Readonly<Record<string, IAutoMovieVector3>> = {
    x: { x: 1, y: 0, z: 0 },
    y: { x: 0, y: 1, z: 0 },
    z: { x: 0, y: 0, z: 1 },
  };
}
