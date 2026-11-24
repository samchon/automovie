import type {
  IAutoMoviePhysicalJointAxis,
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
import { PhysicalRotationVector } from "./PhysicalRotationVector";
import { limitPhysicalSwingTwist } from "./limitPhysicalSwingTwist";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
import { solveXpbdArticulation } from "./solveXpbdArticulation";

/**
 * The joints' position pass over one articulation at once: every joint's anchor
 * rows and its coordinate rows (each locked coordinate, each free one past a
 * bound) are solved together as one constrained projection, the least
 * mass-weighted displacement `min 1/2 dx^T M dx` with `J dx = -C`, by Baraff's
 * linear-time elimination of `[M J^T; J 0]` over the tree whose nodes are the
 * bodies (6 rows: translation of the centre, rotation) and the joints (3 anchor
 * rows and the coordinate rows), eliminated leaves first with no fill-in
 * (Baraff 1996, "Linear-time dynamics using Lagrange multipliers", SIGGRAPH;
 * the direct tree solve of position constraints, Deul, Kugelstadt, Weiler and
 * Bender 2018, "Direct position-based solver for stiff rods"). A light segment
 * between heavy ones (the neck between the chest and the head, a forearm, a
 * digit) is no longer moved again by each neighbour's own correction, as one
 * sweep joint by joint leaves it. The rows are linearised at the present poses
 * and the projection repeated (Newton's method), each step's rows read at the
 * poses the last one left: the anchors always, a joint's limit row while the
 * joint lies outside its admitted set, as MuJoCo instantiates a joint limit
 * only while its distance is below its margin, zero by default
 * (google-deepmind/mujoco, `src/engine/engine_core_constraint.c`,
 * `mj_instantiateLimit`, lines 1312-1325 at commit
 * c6ac13326758a41e3c04c07ef7e7afb38d50b1ea, Apache-2.0, Copyright 2021 DeepMind
 * Technologies Limited). The loop ends by MuJoCo's Newton termination
 * (`src/engine/engine_solver.c`, lines 508-517, 3961-3962 and 4068-4080 at the
 * same commit): once the step's Newton decrement, `1/2 scale a^T M a` with
 * `scale` the inverse trace of the inertia (`inertiaScale`), falls below the
 * solver tolerance (`opt.tolerance`, 1e-8, `src/engine/engine_init.c` line 60),
 * or after the iteration cap (`opt.iterations`, 100, line 95). A position step
 * `dx` over the substep `h` is the acceleration `a = dx / h^2`, as a positional
 * multiplier is the force `f = lambda n / h^2` (Mueller, Macklin, Chentanez,
 * Jeschke and Kim 2020, section 3.3).
 *
 * Anchor row: `C = (c_p + r_p) - (c_c + r_c)`, `J_p = [E | -[r_p]x]`, `J_c =
 * [-E | [r_c]x]` on `(dx, dtheta)`. Coordinate row: with `e` the turn that
 * carries the child's anchor frame into its admitted rotation relative to the
 * parent's (`projectPhysicalJointRotation`) and `d_i` the dual of the joint's
 * motion-subspace basis (`rowsOf`), `d_i . (dtheta_c - dtheta_p) = d_i . e`.
 */
export namespace solveXpbdJointTree {
  /**
   * Project one tree's joints onto their anchors and admitted rotations.
   *
   * @param top The tree's root node (`solveXpbdArticulation.forest`).
   * @param h The substep, seconds.
   */
  export function project(top: solveXpbdArticulation.INode, h: number): void {
    const order: IVisit[] = visit(top);
    if (order.length === 0) return;
    for (let iteration: number = 0; iteration < ITERATIONS; ++iteration) {
      const step: IStep | null = solve(top, order, order.map(rowsOf));
      if (step === null) return;
      if (step.decrement / h ** 4 < TOLERANCE) return;
      step.apply();
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
  }

  /** One Newton step, solved and not yet taken. */
  export interface IStep {
    /**
     * Its Newton decrement in position units, `1/2 dx^T M dx` over the trace of
     * `M`; over `h^4` it is MuJoCo's acceleration decrement.
     */
    decrement: number;

    /** Take the step: displace every dynamic body of the tree. */
    apply(): void;
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

/**
 * A joint's rows at the present poses: the three anchor rows; one row per
 * locked coordinate, always; one per free coordinate while it lies past one of
 * its bounds, MuJoCo's per-degree-of-freedom joint limit
 * (`mj_instantiateLimit`: the distance `side (range - q)`, instantiated below
 * its zero margin); and, for a swing-twist gate or a clinical swing-twist
 * limit, one row along the turn into it, as MuJoCo's ball-joint limit is one
 * row along the rotation's axis (the same function, lines 1349-1363). A
 * coordinate's row is its gradient in the joint's motion subspace: the dual of
 * the basis of its free directions (`solveXpbdArticulation.directions`)
 * completed by the locked ones, so a step moves each coordinate by its own
 * error and no other.
 */
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
  const base: IAutoMovieQuaternion = Quaternion.multiply(
    parent.orientation,
    pf.rotation,
  );
  const relative: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(
      Quaternion.inverse(base),
      Quaternion.multiply(child.orientation, cf.rotation),
    ),
  );
  // A row on the relative turn: n . (dtheta_c - dtheta_p) = value, with n
  // given in the parent's anchor frame.
  const push: (local: IAutoMovieVector3, value: number) => void = (
    local: IAutoMovieVector3,
    value: number,
  ): void => {
    const n: IAutoMovieVector3 = Quaternion.rotateVector(base, local);
    parentRows.push([0, 0, 0, -n.x, -n.y, -n.z]);
    childRows.push([0, 0, 0, n.x, n.y, n.z]);
    right.push(value);
  };
  const boxed: IAutoMovieQuaternion = projectPhysicalJointRotation(
    joint.joint,
    relative,
  );
  const e: IAutoMovieVector3 = PhysicalRotationVector.log(
    Quaternion.multiply(boxed, Quaternion.inverse(relative)),
  );
  if (joint.joint.range !== undefined) {
    const turn: number = Vector3.length(e);
    if (turn > 0) push(Vector3.scale(e, 1 / turn), turn);
  } else {
    const basis: IAutoMovieVector3[] = solveXpbdArticulation.directions(
      joint.joint,
      relative,
    );
    const dual: IAutoMovieVector3[] | null = inverse(basis);
    if (dual !== null)
      basis.forEach((_: IAutoMovieVector3, i: number): void => {
        const declared: IAutoMoviePhysicalJointAxis | undefined =
          joint.joint.axes[i];
        if (declared !== undefined) {
          const q: number | null = solveXpbdArticulation.coordinate(
            joint,
            relative,
            declared,
          );
          if (q === null || !(q < declared.minimum || q > declared.maximum))
            return;
        }
        push(dual[i]!, Vector3.dot(dual[i]!, e));
      });
  }
  if (joint.joint.swingTwist !== undefined) {
    const turned: IAutoMovieVector3 = PhysicalRotationVector.log(
      Quaternion.multiply(
        limitPhysicalSwingTwist(joint.joint.swingTwist, boxed),
        Quaternion.inverse(boxed),
      ),
    );
    const turn: number = Vector3.length(turned);
    if (turn > 0) push(Vector3.scale(turned, 1 / turn), turn);
  }
  return { parent: parentRows, child: childRows, right };
}

/**
 * The dual basis of three directions: the rows of the inverse of the matrix
 * whose columns they are; none when they are dependent.
 */
function inverse(
  basis: readonly IAutoMovieVector3[],
): IAutoMovieVector3[] | null {
  const solve: ((right: readonly number[]) => number[]) | null =
    prepareLinearSystem([
      [basis[0]!.x, basis[0]!.y, basis[0]!.z],
      [basis[1]!.x, basis[1]!.y, basis[1]!.z],
      [basis[2]!.x, basis[2]!.y, basis[2]!.z],
    ]);
  if (solve === null) return null;
  // Rows of B^-1 are the columns of B^-T, B^T's rows being the directions.
  return [0, 1, 2].map((i: number): IAutoMovieVector3 => {
    const column: number[] = solve([
      i === 0 ? 1 : 0,
      i === 1 ? 1 : 0,
      i === 2 ? 1 : 0,
    ]);
    return { x: column[0]!, y: column[1]!, z: column[2]! };
  });
}
/**
 * One Newton step: the KKT system over the tree eliminated leaves first and
 * back-substituted, with its decrement; none when a block is singular.
 */
function solve(
  top: solveXpbdArticulation.INode,
  order: readonly solveXpbdJointTree.IVisit[],
  rows: readonly solveXpbdJointTree.IJointRows[],
): solveXpbdJointTree.IStep | null {
  // The nodes: each dynamic body (6) and each joint (its rows), with its
  // parent node and the block coupling it there; a joint's parent is its
  // parent body when that is dynamic, else none (the fixed base).
  const nodes: INode[] = [];
  const bodies: Map<AutoMovieXpbdBody, number> = new Map();
  const bodyNode = (body: AutoMovieXpbdBody, parent: number): number => {
    const index: number = nodes.length;
    const block: number[][] = mass(body);
    nodes.push({
      matrix: block.map((row: number[]): number[] => [...row]),
      right: [0, 0, 0, 0, 0, 0],
      parent,
      coupling: [],
      body,
      mass: block,
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
    if (factor === null) return null;
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
  // The decrement 1/2 dx^T M dx over trace(M), MuJoCo's `inertiaScale`.
  let energy: number = 0;
  let trace: number = 0;
  nodes.forEach((node: INode, i: number): void => {
    if (node.body === undefined) return;
    const d: number[] = x[i]!;
    for (let a: number = 0; a < 6; ++a) {
      trace += node.mass![a]![a]!;
      for (let b: number = 0; b < 6; ++b)
        energy += d[a]! * node.mass![a]![b]! * d[b]!;
    }
  });
  return {
    decrement: trace > 0 ? (0.5 * energy) / trace : 0,
    apply: (): void =>
      nodes.forEach((node: INode, i: number): void => {
        if (node.body === undefined) return;
        const d: number[] = x[i]!;
        AutoMovieXpbdMath.displace(
          node.body,
          { x: d[0]!, y: d[1]!, z: d[2]! },
          { x: d[3]!, y: d[4]!, z: d[5]! },
        );
      }),
  };
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

  /** A body node's own mass block, before elimination; absent for a joint. */
  mass?: number[][];
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
 * MuJoCo's default solver tolerance (`opt.tolerance`, google-deepmind/mujoco,
 * `src/engine/engine_init.c` line 60 at
 * c6ac13326758a41e3c04c07ef7e7afb38d50b1ea, Apache-2.0).
 */
const TOLERANCE: number = 1e-8;

/**
 * MuJoCo's default solver iteration cap (`opt.iterations`, the same file, line
 * 95): a bound on the cost, not a convergence rule.
 */
const ITERATIONS: number = 100;
