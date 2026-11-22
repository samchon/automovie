import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { prepareLinearSystem } from "../math/prepareLinearSystem";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";

/**
 * One articulation's impulse response by the articulated-body algorithm
 * (Featherstone 2008, "Rigid Body Dynamics Algorithms", chapter 7), in
 * world-aligned spatial coordinates (angular, linear) about the tree's
 * origin.
 *
 * `factor` runs the inward sweep's matrix part once: each edge's
 * `U = I^A S`, its joint-space term `D = S^T I^A S + diag(h c)` with every
 * free motor's backward-Euler damping, `D^-1 U^T`, and the articulated
 * inertias `I^A = I - U D^-1 U^T` gathered into each parent. `propagate`
 * then answers one right-hand side in one inward and one outward sweep:
 * the joint impulses `b` (the motors' `h c (s - qd)`, or a held motor's
 * cap) when `drive` is set, and an external spatial impulse on one body,
 * giving every body's velocity change and every axis's relative angular
 * velocity change. Because the factor does not depend on the right-hand
 * side, a test impulse costs only the two vector sweeps (Mirtich 1996,
 * "Impulse-based Dynamic Simulation of Rigid Body Systems", chapter 6).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the source, both sweeps, what the factor holds and what a propagation returns.
 * @evidence contracts/development/design.md#principled-representation Spatial vectors as six numbers (angular, linear), spatial matrices as 36 numbers row-major; impulses in newton seconds and newton metre seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The tree records, `factor` and `propagate` serve solveXpbdArticulation and its contact rows; the spatial helpers are what both read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Inertias are the bodies', damping and caps the motors'; nothing is tuned here.
 */
export namespace AutoMovieXpbdArticulation {
  /**
   * One articulation: its bodies (the root first), its edges (each after its parent's) and its spatial origin.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record holds.
   * @evidence contracts/development/design.md#principled-representation Bodies, edges and the origin in metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by solveXpbdArticulation and read by every sweep.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Indices into the states instead of links, so a tree is plain data.
   */
  export interface ITree {
    /** The root body's centre, metres. */
    origin: IAutoMovieVector3;

    /** Whether the root is dynamic; a kinematic root is the fixed base. */
    free: boolean;

    /** The tree's bodies, the root first. */
    states: IState[];

    /** The tree's joints, each after its parent's. */
    edges: IEdge[];
  }

  /**
   * One body of a tree.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record holds.
   * @evidence contracts/development/design.md#principled-representation The body and its own spatial inertia, kilogram metres squared and kilograms.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built once per tree solve; the factor reads its inertia.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The inertia is the body's own at the current pose.
   */
  export interface IState {
    /** The world's body. */
    body: AutoMovieXpbdBody;

    /** Its own spatial inertia about the origin, row-major 6x6. */
    own: number[];
  }

  /**
   * One joint of a tree.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record holds.
   * @evidence contracts/development/design.md#principled-representation Parent and child indices with the joint's free axes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built once per tree solve; the sweeps read it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One axis record per declared free axis.
   */
  export interface IEdge {
    /** The parent's index in the tree's states. */
    parent: number;

    /** The child's index in the tree's states. */
    child: number;

    /** The joint's free axes, in the profile's order. */
    axes: IAxis[];
  }

  /**
   * One free axis of an edge.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record holds.
   * @evidence contracts/development/design.md#principled-representation A spatial column, the axis's motor and its present rate in radians per second, and a held impulse in newton metre seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built per tree solve; the factor and the cap check read it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The motor is the joint's own; a held motor keeps its cap.
   */
  export interface IAxis {
    /** Spatial motion column: unit rotation about the anchor. */
    column: number[];

    /** The axis's active motor; absent when none drives it. */
    motor?: AutoMovieXpbdJoint.IMotor;

    /** Present relative angular velocity about the axis, radians per second. */
    present: number;

    /** The impulse once its cap holds the motor; absent while free. */
    fixed?: number;
  }

  /**
   * The matrix part of the inward sweep.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record holds.
   * @evidence contracts/development/design.md#principled-representation Per-edge factors and the root's solve.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by factor and read by propagate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Holds only what every right-hand side shares.
   */
  export interface IFactor {
    /** Each edge's factor, in the tree's edge order. */
    edges: IEdgeFactor[];

    /** The root's articulated inertia solve; absent for a kinematic root. */
    root?: Solve;
  }

  /**
   * One edge's factor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record holds.
   * @evidence contracts/development/design.md#principled-representation U, D^-1 U^T, D^-1 and the joint terms per axis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by factor and read by propagate and the cap check.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The motor terms are the joint's implicit damper.
   */
  export interface IEdgeFactor {
    /** `U = I^A S` per axis. */
    u: number[][];

    /** Rows of `D^-1 U^T` per axis. */
    gain: number[][];

    /** Applies `D^-1`. */
    solve: Solve;

    /** Each axis's implicit damping term `h c`; zero without a free motor. */
    damping: number[];

    /** Each axis's joint impulse `b`: `h c (s - qd)` for a free motor, the cap for a held one, else zero. */
    impulse: number[];
  }

  /**
   * A linear solve with one factored matrix.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record holds.
   * @evidence contracts/development/design.md#principled-representation A function from a right-hand side to its solution.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Produced by prepareLinearSystem and kept in a factor.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The factored matrix is fixed for the solve's lifetime.
   */
  export type Solve = (right: readonly number[]) => number[];

  /**
   * An external spatial impulse on one body of a tree.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record holds.
   * @evidence contracts/development/design.md#principled-representation A state index and a spatial impulse in newton metre seconds and newton seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Passed to propagate by the contact rows' test impulses.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One body per impulse, so each test is one propagation.
   */
  export interface IExternal {
    /** The body's index in the tree's states. */
    state: number;

    /** Spatial impulse about the origin (moment, force). */
    impulse: number[];
  }

  /**
   * A joint impulse on one free axis of one edge, acting between the
   * edge's parent and child.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record holds.
   * @evidence contracts/development/design.md#principled-representation An edge index, an axis index and an impulse in newton metre seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Passed to propagate for the support rows' joint-impulse responses.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One axis per impulse, so each response is one propagation.
   */
  export interface IJointImpulse {
    /** The edge's index in the tree's edges. */
    edge: number;

    /** The axis's index in the edge's axes. */
    axis: number;

    /** The impulse, newton metre seconds. */
    impulse: number;
  }

  /**
   * The velocity changes of one propagation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record holds.
   * @evidence contracts/development/design.md#principled-representation Per-body spatial velocity changes and per-axis rate changes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by propagate and combined by the solve.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Fresh arrays per propagation.
   */
  export interface IResponse {
    /** Each body's spatial velocity change. */
    change: number[][];

    /** Each edge's axes' relative angular velocity changes. */
    rates: number[][];
  }

  /**
   * Factor a tree's inward sweep.
   *
   * @param tree The tree.
   * @param h The substep, seconds.
   * @returns The factor, or null when a joint or root inertia is singular.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is factored and the singular case.
   * @evidence contracts/development/implementation.md#principled-implementation Featherstone 2008, chapter 7: U = I^A S, D = S^T U + diag(h c), I^A_parent += I^A - U D^-1 U^T, inward from the leaves.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reverse loop over the edges, then the root.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A singular D or root inertia returns null instead of dividing.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the tree's bodies with constant 6x6 work per edge.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every propagation of the same substep and held-motor set reuses the factor.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh arrays; retains nothing.
   */
  export function factor(tree: ITree, h: number): IFactor | null {
    const inertia: number[][] = tree.states.map(
      (state: IState): number[] => state.own,
    );
    const edges: IEdgeFactor[] = new Array<IEdgeFactor>(tree.edges.length);
    for (let index: number = tree.edges.length - 1; index >= 0; --index) {
      const edge: IEdge = tree.edges[index]!;
      const child: number[] = inertia[edge.child]!;
      const u: number[][] = edge.axes.map((axis: IAxis): number[] =>
        multiply(child, axis.column),
      );
      const damping: number[] = edge.axes.map((axis: IAxis): number =>
        axis.motor !== undefined && axis.fixed === undefined
          ? h * axis.motor.damping
          : 0,
      );
      const impulse: number[] = edge.axes.map(
        (axis: IAxis): number =>
          axis.fixed ??
          (axis.motor !== undefined
            ? h * axis.motor.damping * (axis.motor.speed - axis.present)
            : 0),
      );
      const solve: Solve | null =
        edge.axes.length === 0
          ? (right: readonly number[]): number[] => [...right]
          : prepareLinearSystem(
              edge.axes.map((row: IAxis, k: number): number[] =>
                u.map(
                  (column: number[], l: number): number =>
                    dot(row.column, column) + (k === l ? damping[k]! : 0),
                ),
              ),
            );
      if (solve === null) return null;
      // Rows of D^-1 U^T, solved one spatial coordinate at a time.
      const columns: number[][] = SIX.map((m: number): number[] =>
        solve(u.map((column: number[]): number => column[m]!)),
      );
      const gain: number[][] = edge.axes.map(
        (_: IAxis, k: number): number[] =>
          columns.map((column: number[]): number => column[k]!),
      );
      edges[index] = { u, gain, solve, damping, impulse };
      inertia[edge.parent] = inertia[edge.parent]!.map(
        (value: number, cell: number): number => {
          const r: number = Math.floor(cell / 6);
          const m: number = cell % 6;
          let sum: number = value + child[cell]!;
          for (let k: number = 0; k < u.length; ++k)
            sum -= u[k]![r]! * gain[k]![m]!;
          return sum;
        },
      );
    }
    if (!tree.free) return { edges };
    const root: Solve | null = prepareLinearSystem(
      SIX.map((r: number): number[] => inertia[0]!.slice(r * 6, r * 6 + 6)),
    );
    return root === null ? null : { edges, root };
  }

  /**
   * One right-hand side through a factored tree.
   *
   * @param tree The tree.
   * @param factored Its factor.
   * @param drive Whether the motors' joint impulses act.
   * @param external An external impulse on one body, if any.
   * @param joint A further joint impulse on one axis, if any.
   * @returns Every body's and axis's velocity change.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both inputs and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation Featherstone 2008, chapter 7: p^A = -f_ext, then p^A_parent += p^A + U D^-1 (b - S^T p^A) inward; the root's change -I^A^-1 p^A; then qd = D^-1 (b - S^T p^A) - D^-1 U^T v_parent and v = v_parent + S qd outward.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reverse loop, the root, one forward loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A kinematic root does not move.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the tree's bodies with constant 6-vector work per edge.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the factor's U, D^-1 U^T and D^-1.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh arrays; retains nothing.
   */
  export function propagate(
    tree: ITree,
    factored: IFactor,
    drive: boolean,
    external?: IExternal,
    joint?: IJointImpulse,
  ): IResponse {
    const bias: number[][] = tree.states.map((): number[] => ZERO);
    if (external !== undefined)
      bias[external.state] = external.impulse.map(
        (value: number): number => -value,
      );
    const drives: number[][] = new Array<number[]>(tree.edges.length);
    for (let index: number = tree.edges.length - 1; index >= 0; --index) {
      const edge: IEdge = tree.edges[index]!;
      const f: IEdgeFactor = factored.edges[index]!;
      const child: number[] = bias[edge.child]!;
      const d: number[] = f.solve(
        edge.axes.map(
          (axis: IAxis, k: number): number =>
            (drive ? f.impulse[k]! : 0) +
            (joint !== undefined && joint.edge === index && joint.axis === k
              ? joint.impulse
              : 0) -
            dot(axis.column, child),
        ),
      );
      drives[index] = d;
      bias[edge.parent] = bias[edge.parent]!.map(
        (value: number, r: number): number => {
          let sum: number = value + child[r]!;
          for (let k: number = 0; k < d.length; ++k) sum += f.u[k]![r]! * d[k]!;
          return sum;
        },
      );
    }
    const change: number[][] = tree.states.map((): number[] => ZERO);
    if (factored.root !== undefined)
      change[0] = factored.root(bias[0]!.map((value: number): number => -value));
    const rates: number[][] = new Array<number[]>(tree.edges.length);
    tree.edges.forEach((edge: IEdge, index: number): void => {
      const f: IEdgeFactor = factored.edges[index]!;
      const from: number[] = change[edge.parent]!;
      const rate: number[] = drives[index]!.map(
        (value: number, k: number): number => value - dot(f.gain[k]!, from),
      );
      rates[index] = rate;
      change[edge.child] = from.map((value: number, r: number): number => {
        let sum: number = value;
        edge.axes.forEach((axis: IAxis, k: number): void => {
          sum += axis.column[r]! * rate[k]!;
        });
        return sum;
      });
    });
    return { change, rates };
  }

  /**
   * A body's spatial inertia about `origin` in world axes, row-major 6x6
   * over (angular, linear): `[[I_c + m [c]x [c]x^T, m [c]x], [m [c]x^T, m E]]`
   * with `c` its centre relative to `origin` (Featherstone 2008, eq. 2.63);
   * zero for a kinematic body.
   *
   * @param body The body.
   * @param origin The tree's origin, metres.
   * @returns 36 numbers, row-major.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the matrix, its frame and the kinematic zero.
   * @evidence contracts/development/implementation.md#principled-implementation Featherstone 2008, eq. 2.63, with the world inertia at the current pose and [c]x [c]x^T = |c|^2 E - c c^T.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the nine 3x3 cells filling the four blocks.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A kinematic body is all zeros.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: three inertia products.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure computation over its arguments; each tree solve reads it once per body.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh array; retains nothing.
   */
  export function spatialInertia(
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

  /**
   * The spatial impulse about the origin of a linear impulse at a point:
   * `(r x f, f)`.
   *
   * @param point The point relative to the origin, metres.
   * @param force The linear impulse, newton seconds.
   * @returns Six numbers (moment, force).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the formula and its order.
   * @evidence contracts/development/implementation.md#principled-implementation A force's moment about the origin is r x f.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cross product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure computation over its arguments.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh array; retains nothing.
   */
  export function spatialImpulse(
    point: IAutoMovieVector3,
    force: IAutoMovieVector3,
  ): number[] {
    const moment: IAutoMovieVector3 = Vector3.cross(point, force);
    return [moment.x, moment.y, moment.z, force.x, force.y, force.z];
  }

  /**
   * The velocity change of a point under a body's spatial velocity
   * change: `dv_O + dw x r`.
   *
   * @param change The body's spatial velocity change.
   * @param point The point relative to the origin, metres.
   * @returns Metres per second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the formula.
   * @evidence contracts/development/implementation.md#principled-implementation A rigid motion's velocity at r is its origin velocity plus w x r.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cross product and one sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No special case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure computation over its arguments.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector; retains nothing.
   */
  export function pointChange(
    change: readonly number[],
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Vector3.add(
      vector(change, 3),
      Vector3.cross(vector(change, 0), point),
    );
  }

  /** A row-major 6x6 matrix times a 6-vector. */
  function multiply(matrix: readonly number[], v: readonly number[]): number[] {
    return SIX.map((r: number): number => {
      let sum: number = 0;
      for (let k: number = 0; k < 6; ++k) sum += matrix[r * 6 + k]! * v[k]!;
      return sum;
    });
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

  /** The spatial coordinates' indices. */
  const SIX: readonly number[] = [0, 1, 2, 3, 4, 5];

  /** The zero spatial vector; never mutated, every update builds a new array. */
  const ZERO: number[] = [0, 0, 0, 0, 0, 0];

  /** The 3x3 identity's columns, concatenated. */
  const IDENTITY: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
}
