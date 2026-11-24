import type {
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { prepareLinearSystem } from "../math/prepareLinearSystem";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";
import { AutoMovieXpbdMath } from "./AutoMovieXpbdMath";
import { PhysicalRotationVector } from "./PhysicalRotationVector";
import { limitPhysicalSwingTwist } from "./limitPhysicalSwingTwist";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
import type { solveXpbdArticulation } from "./solveXpbdArticulation";

/**
 * The joints' position pass over one articulation at once: every joint's anchor
 * rows and, for a joint outside its admitted rotations, its limit row are
 * solved together as one constrained projection, the least mass-weighted
 * displacement `min 1/2 dx^T M dx` with `J dx = -C`, by Baraff's linear-time
 * elimination of `[M J^T; J 0]` over the tree whose nodes are the bodies (6
 * rows: translation of the centre, rotation) and the joints (3 anchor rows, and
 * one limit row while the joint is past its limit), eliminated leaves first
 * with no fill-in (Baraff 1996, "Linear-time dynamics using Lagrange
 * multipliers", SIGGRAPH; the direct tree solve of position constraints, Deul,
 * Kugelstadt, Weiler and Bender 2018, "Direct position-based solver for stiff
 * rods"). A light segment between heavy ones (the neck between the chest and
 * the head, a forearm, a digit) is no longer moved again by each neighbour's
 * own correction, as one sweep joint by joint leaves it. The rows are
 * linearised at the present poses and the projection repeated (Newton's method,
 * quadratically convergent near the solution: Dennis and Schnabel 1983,
 * "Numerical Methods for Unconstrained Optimization and Nonlinear Equations",
 * theorem 5.2.1) to the joints' tolerance (`ROM_TOLERANCE`, the resolution to
 * which a solver need resolve a joint's angle): a limit's turn within it, and
 * an anchor's gap within the arc it subtends at the anchor's longer arm. The
 * loop ends as MuJoCo's constraint solver ends its own (google-deepmind/mujoco,
 * `src/engine/engine_solver.c`, Apache-2.0, Copyright 2021 DeepMind
 * Technologies Limited): once every row is within its tolerance, once a step no
 * longer lowers the worst row, or at its default iteration cap
 * (`opt.iterations`, 100), a bound on the cost and not a convergence rule. A
 * joint's limit row is active while the joint is outside its admitted set at
 * all, the projection's own membership test.
 *
 * Anchor row: `C = (c_p + r_p) - (c_c + r_c)`, `J_p = [E | -[r_p]x]`, `J_c =
 * [-E | [r_c]x]` on `(dx, dtheta)`. Limit row: the turn `e` that carries the
 * child's anchor frame into its nearest admitted rotation relative to the
 * parent's (`projectPhysicalJointRotation`, then the clinical swing-twist
 * limit), `n = e / |e|`, `n . (dtheta_c - dtheta_p) = |e|`.
 */
export namespace solveXpbdJointTree {
  /**
   * Project one tree's joints onto their anchors and admitted rotations.
   *
   * @param top The tree's root node (`solveXpbdArticulation.forest`).
   */
  export function project(top: solveXpbdArticulation.INode): void {
    const order: IVisit[] = visit(top);
    if (order.length === 0) return;
    let previous: number = Infinity;
    for (let step: number = 0; step < ITERATIONS; ++step) {
      const rows: IJointRows[] = order.map(rowsOf);
      const worst: number = Math.max(
        ...rows.map((r: IJointRows): number => r.worst),
      );
      if (!(worst > 1) || (step !== 0 && !(worst < previous))) return;
      previous = worst;
      if (!solve(top, order, rows)) return;
    }
  }

  /** A joint of the tree with its parent and child nodes. */
  export interface IVisit {
    /** The joint. */
    joint: AutoMovieXpbdJoint;

    /** Its parent body. */
    parent: AutoMovieXpbdBody;

    /** Its child body. */
    child: AutoMovieXpbdBody;
  }

  /** One joint's linearised rows at the present poses. */
  export interface IJointRows {
    /** The rows' Jacobian on the parent's `(dx, dtheta)`, row-major. */
    parent: number[][];

    /** The rows' Jacobian on the child's `(dx, dtheta)`, row-major. */
    child: number[][];

    /** The rows' right-hand side, `-C`. */
    right: number[];

    /** The worst row's error over its tolerance. */
    worst: number;
  }
}

/** The tree's joints, parents before children. */
function visit(top: solveXpbdArticulation.INode): solveXpbdJointTree.IVisit[] {
  const out: solveXpbdJointTree.IVisit[] = [];
  const stack: solveXpbdArticulation.INode[] = [top];
  while (stack.length !== 0) {
    const node: solveXpbdArticulation.INode = stack.pop()!;
    for (const next of node.children) {
      out.push({ joint: next.edge!, parent: node.body, child: next.body });
      stack.push(next);
    }
  }
  return out;
}

/** A joint's rows at the present poses. */
function rowsOf(v: solveXpbdJointTree.IVisit): solveXpbdJointTree.IJointRows {
  const { joint, parent, child } = v;
  const pf: IAutoMovieRigidTransform = joint.parentFrame();
  const cf: IAutoMovieRigidTransform = joint.childFrame();
  const rp: IAutoMovieVector3 = arm(parent, pf.position);
  const rc: IAutoMovieVector3 = arm(child, cf.position);
  const gap: IAutoMovieVector3 = Vector3.subtract(
    Vector3.add(parent.center, rp),
    Vector3.add(child.center, rc),
  );
  // The anchor's tolerance: the arc the joints' tolerance subtends at its
  // longer arm.
  const reach: number =
    TOLERANCE * Math.max(Vector3.length(rp), Vector3.length(rc));
  const parentRows: number[][] = [
    [1, 0, 0, 0, rp.z, -rp.y],
    [0, 1, 0, -rp.z, 0, rp.x],
    [0, 0, 1, rp.y, -rp.x, 0],
  ];
  const childRows: number[][] = [
    [-1, 0, 0, 0, -rc.z, rc.y],
    [0, -1, 0, rc.z, 0, -rc.x],
    [0, 0, -1, -rc.y, rc.x, 0],
  ];
  const right: number[] = [-gap.x, -gap.y, -gap.z];
  const separation: number = Vector3.length(gap);
  let worst: number = separation > reach ? separation / reach : 0;
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
  const e: IAutoMovieVector3 = Quaternion.rotateVector(
    base,
    PhysicalRotationVector.log(
      Quaternion.multiply(admitted, Quaternion.inverse(relative)),
    ),
  );
  const turn: number = Vector3.length(e);
  if (turn > 0) {
    const n: IAutoMovieVector3 = Vector3.scale(e, 1 / turn);
    parentRows.push([0, 0, 0, -n.x, -n.y, -n.z]);
    childRows.push([0, 0, 0, n.x, n.y, n.z]);
    right.push(turn);
    worst = Math.max(worst, turn / TOLERANCE);
  }
  return { parent: parentRows, child: childRows, right, worst };
}

/**
 * One projection: the KKT system over the tree eliminated leaves first, then
 * the displacements applied. False when a block is singular.
 */
function solve(
  top: solveXpbdArticulation.INode,
  order: readonly solveXpbdJointTree.IVisit[],
  rows: readonly solveXpbdJointTree.IJointRows[],
): boolean {
  // The nodes: each dynamic body (6) and each joint (its rows), with its
  // parent node and the block coupling it there; a joint's parent is its
  // parent body when that is dynamic, else none (the fixed base).
  const nodes: INode[] = [];
  const bodies: Map<AutoMovieXpbdBody, number> = new Map();
  const bodyNode = (body: AutoMovieXpbdBody, parent: number): number => {
    const index: number = nodes.length;
    nodes.push({
      matrix: mass(body),
      right: [0, 0, 0, 0, 0, 0],
      parent,
      coupling: [],
      body,
    });
    bodies.set(body, index);
    return index;
  };
  if (top.body.dynamic) bodyNode(top.body, -1);
  order.forEach((v: solveXpbdJointTree.IVisit, j: number): void => {
    const r: solveXpbdJointTree.IJointRows = rows[j]!;
    const up: number | undefined = bodies.get(v.parent);
    const index: number = nodes.length;
    nodes.push({
      matrix: r.right.map((): number[] => r.right.map((): number => 0)),
      right: [...r.right],
      parent: up ?? -1,
      // The joint's rows on its parent body: H_{joint, parent} = J_p.
      coupling: up === undefined ? [] : r.parent,
    });
    // The child body hangs from the joint: H_{child, joint} = J_c^T.
    const child: number = bodyNode(v.child, index);
    nodes[child]!.coupling = transpose(r.child);
  });

  // Leaves first: every node after its parent, so the reverse eliminates
  // each node into its parent before the parent is eliminated.
  const solves: (((right: readonly number[]) => number[]) | null)[] = [];
  for (let i: number = nodes.length - 1; i >= 0; --i) {
    const node: INode = nodes[i]!;
    const factor: ((right: readonly number[]) => number[]) | null =
      prepareLinearSystem(node.matrix);
    if (factor === null) return false;
    solves[i] = factor;
    if (node.parent < 0) continue;
    const up: INode = nodes[node.parent]!;
    // A^-1 B, column by column, and A^-1 r.
    const columns: number[][] = up.matrix.map(
      (_: number[], c: number): number[] =>
        factor(node.coupling.map((row: number[]): number => row[c]!)),
    );
    const own: number[] = factor(node.right);
    for (let a: number = 0; a < up.matrix.length; ++a) {
      for (let b: number = 0; b < up.matrix.length; ++b) {
        let sum: number = 0;
        for (let k: number = 0; k < node.coupling.length; ++k)
          sum += node.coupling[k]![a]! * columns[b]![k]!;
        up.matrix[a]![b]! -= sum;
      }
      let sum: number = 0;
      for (let k: number = 0; k < node.coupling.length; ++k)
        sum += node.coupling[k]![a]! * own[k]!;
      up.right[a]! -= sum;
    }
  }
  // Roots down: x_i = A_i^-1 (r_i - B_i x_parent).
  const x: number[][] = new Array<number[]>(nodes.length);
  nodes.forEach((node: INode, i: number): void => {
    const known: number[] =
      node.parent < 0
        ? node.right
        : node.right.map(
            (value: number, k: number): number =>
              value -
              node.coupling[k]!.reduce(
                (sum: number, entry: number, c: number): number =>
                  sum + entry * x[node.parent]![c]!,
                0,
              ),
          );
    x[i] = solves[i]!(known);
  });
  nodes.forEach((node: INode, i: number): void => {
    if (node.body === undefined) return;
    const d: number[] = x[i]!;
    AutoMovieXpbdMath.displace(
      node.body,
      { x: d[0]!, y: d[1]!, z: d[2]! },
      { x: d[3]!, y: d[4]!, z: d[5]! },
    );
  });
  return true;
}

/** One node of the elimination: a body or a joint. */
interface INode {
  /** Its diagonal block, reduced by its eliminated children. */
  matrix: number[][];

  /** Its right-hand side, reduced likewise. */
  right: number[];

  /** Its parent node's index; -1 at a root. */
  parent: number;

  /** Its block to the parent node, its rows by the parent's columns. */
  coupling: number[][];

  /** The body a body node moves; absent for a joint. */
  body?: AutoMovieXpbdBody;
}

/**
 * A body's mass block on `(dx, dtheta)`: `m E` and its world inertia, the
 * inverse of the substep's frozen inverse inertia.
 */
function mass(body: AutoMovieXpbdBody): number[][] {
  const m: number = body.mass();
  const inverse: number[][] = [
    body.frozen.slice(0, 3),
    body.frozen.slice(3, 6),
    body.frozen.slice(6, 9),
  ];
  const solveInverse: ((right: readonly number[]) => number[]) | null =
    prepareLinearSystem(inverse);
  const columns: number[][] =
    solveInverse === null
      ? [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ]
      : [
          solveInverse([1, 0, 0]),
          solveInverse([0, 1, 0]),
          solveInverse([0, 0, 1]),
        ];
  return [
    [m, 0, 0, 0, 0, 0],
    [0, m, 0, 0, 0, 0],
    [0, 0, m, 0, 0, 0],
    [0, 0, 0, columns[0]![0]!, columns[1]![0]!, columns[2]![0]!],
    [0, 0, 0, columns[0]![1]!, columns[1]![1]!, columns[2]![1]!],
    [0, 0, 0, columns[0]![2]!, columns[1]![2]!, columns[2]![2]!],
  ];
}

/** A matrix's transpose. */
function transpose(rows: readonly (readonly number[])[]): number[][] {
  return rows[0]!.map((_: number, c: number): number[] =>
    rows.map((row: readonly number[]): number => row[c]!),
  );
}

/** A world anchor arm: the frame's point from the body's centre of mass. */
function arm(
  body: AutoMovieXpbdBody,
  position: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    body.orientation,
    Vector3.subtract(position, body.centerOfMass),
  );
}

/**
 * The joints' tolerance (`ROM_TOLERANCE`), radians: the resolution to which a
 * solver need resolve a joint's angle.
 */
const TOLERANCE: number = (ROM_TOLERANCE * Math.PI) / 180;

/**
 * MuJoCo's default solver iteration cap (`opt.iterations`,
 * google-deepmind/mujoco, Apache-2.0): a bound on the cost, never reached by a
 * converging step.
 */
const ITERATIONS: number = 100;
