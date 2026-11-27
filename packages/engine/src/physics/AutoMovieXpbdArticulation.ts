import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { AutoMovieEngineMath } from "../math/AutoMovieEngineMath";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";
import type { AutoMovieXpbdSupportRows } from "./AutoMovieXpbdSupportRows";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { solveXpbdArticulation as Articulation } from "./internal/solveXpbdArticulation";
import { solveXpbdArticulationContacts as Contacts } from "./internal/solveXpbdArticulationContacts";
import { solveXpbdArticulationTask as Task } from "./internal/solveXpbdArticulationTask";

/**
 * One articulation's impulse response by the articulated-body algorithm
 * (Featherstone 2008, "Rigid Body Dynamics Algorithms", chapter 7), in
 * world-aligned spatial coordinates (angular, linear) about the tree's origin.
 *
 * `factor` runs the inward sweep's matrix part once: each edge's `U = I^A S`,
 * its joint-space term `D = S^T I^A S + diag(h c)` with every free motor's
 * backward-Euler damping, `D^-1 U^T`, and the articulated inertias `I^A = I - U
 * D^-1 U^T` gathered into each parent. `propagate` then answers one right-hand
 * side in one inward and one outward sweep: the joint impulses `b` (the motors'
 * `h c (s - qd)`, or a held motor's cap) when `drive` is set, and an external
 * spatial impulse on one body, giving every body's velocity change and every
 * axis's relative angular velocity change. Because the factor does not depend
 * on the right-hand side, a test impulse costs only the two vector sweeps
 * (Mirtich 1996, "Impulse-based Dynamic Simulation of Rigid Body Systems",
 * chapter 6).
 */
export namespace AutoMovieXpbdArticulation {
  /**
   * One articulation: its bodies (the root first), its edges (each after its
   * parent's) and its spatial origin.
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

  /** One body of a tree. */
  export interface IState {
    /** The world's body. */
    body: AutoMovieXpbdBody;

    /** Its own spatial inertia about the origin, row-major 6x6. */
    own: number[];
  }

  /** One joint of a tree. */
  export interface IEdge {
    /** The parent's index in the tree's states. */
    parent: number;

    /** The child's index in the tree's states. */
    child: number;

    /** The joint's free axes, in the profile's order. */
    axes: IAxis[];
  }

  /** One free axis of an edge. */
  export interface IAxis {
    /** Spatial motion column: unit rotation about the anchor. */
    column: number[];

    /** The axis's active motor; absent when none drives it. */
    motor?: AutoMovieXpbdJoint.IMotor;

    /** Present relative angular velocity about the axis, radians per second. */
    present: number;

    /** The impulse once its cap holds the motor; absent while free. */
    fixed?: number;

    /**
     * Whether the axis is held at its limit: its relative rate after the pass
     * is zero, a prescribed motion of the joint rather than a free axis of `S`
     * (Featherstone 2008, section 7.3, prescribed joint motion). Distinct from
     * `fixed`, which holds a motor's impulse at its cap.
     */
    locked?: boolean;
  }

  /** The matrix part of the inward sweep. */
  export interface IFactor {
    /** Each edge's factor, in the tree's edge order. */
    edges: IEdgeFactor[];

    /** The root's articulated inertia solve; absent for a kinematic root. */
    root?: Solve;
  }

  /** One edge's factor. */
  export interface IEdgeFactor {
    /** `U = I^A S` per free axis; zero for a locked one. */
    u: number[][];

    /**
     * `I^A s` per locked axis, the child's articulated momentum per unit of its
     * prescribed rate; zero for a free one.
     */
    held: number[][];

    /** Rows of `D^-1 U^T` per axis. */
    gain: number[][];

    /** Applies `D^-1`. */
    solve: Solve;

    /** Each axis's implicit damping term `h c`; zero without a free motor. */
    damping: number[];

    /**
     * Each axis's joint impulse `b`: `h c (s - qd)` for a free motor, the cap
     * for a held one, else zero.
     */
    impulse: number[];
  }

  /** A linear solve with one factored matrix. */
  export type Solve = (right: readonly number[]) => number[];

  /** An external spatial impulse on one body of a tree. */
  export interface IExternal {
    /** The body's index in the tree's states. */
    state: number;

    /** Spatial impulse about the origin (moment, force). */
    impulse: number[];
  }

  /**
   * A joint impulse on one free axis of one edge, acting between the edge's
   * parent and child.
   */
  export interface IJointImpulse {
    /** The edge's index in the tree's edges. */
    edge: number;

    /** The axis's index in the edge's axes. */
    axis: number;

    /** The impulse, newton metre seconds. */
    impulse: number;
  }

  /** The velocity changes of one propagation. */
  export interface IResponse {
    /** Each body's spatial velocity change. */
    change: number[][];

    /** Each edge's axes' relative angular velocity changes. */
    rates: number[][];
  }

  /** Every jointed body's node and the joints outside the articulated forest. */
  export interface IForest {
    /** Every jointed body's node. */
    nodes: ReadonlyMap<AutoMovieXpbdBody, INode>;
    /** The joints outside the forest, in creation order. */
    loops: readonly AutoMovieXpbdJoint[];
  }

  /** One body's position in the articulated forest. */
  export interface INode {
    /** The world's body. */
    body: AutoMovieXpbdBody;
    /** The joint to its parent; absent at a root. */
    edge?: AutoMovieXpbdJoint;
    /** Its parent node; absent at a root. */
    parent?: INode;
    /** Its child nodes, in joint creation order. */
    children: INode[];
  }

  /** Inputs for the support impulse room left by contact passes. */
  export interface IRoomInput {
    /** The support force bound, newtons. */
    force: number;
    /** The substep, seconds. */
    h: number;
    /** The impulse already given by contact passes, newton seconds. */
    given: number;
  }

  /** An actuated axis between a pressed support and the tree root. */
  export type IActuator = Contacts.IActuator;

  /** A solved support response and the impulses to record. */
  export type IHeld = Contacts.IHeld;

  /** One support impulse to record on a contact. */
  export type IRecord = Contacts.IRecord;

  /** One contact row acting on a body in the tree. */
  export type IRow = Contacts.IRow;

  /** The rows and friction of one participating support patch. */
  export type IPatch = Contacts.IPatch;

  /** All support rows and patches for a tree. */
  export type ISet = Contacts.ISet;

  /** Two tangential values on a support patch. */
  export type ISlip = Contacts.ISlip;

  /**
   * Factor a tree's inward sweep.
   *
   * @param tree The tree.
   * @param h The substep, seconds.
   * @returns The factor, or null when a joint or root inertia is singular.
   */
  export function factor(tree: ITree, h: number): IFactor | null {
    const inertia: number[][] = tree.states.map(
      (state: IState): number[] => state.own,
    );
    const edges: IEdgeFactor[] = new Array<IEdgeFactor>(tree.edges.length);
    for (let index: number = tree.edges.length - 1; index >= 0; --index) {
      const edge: IEdge = tree.edges[index]!;
      const child: number[] = inertia[edge.child]!;
      // A locked axis leaves `S`: its column carries no articulated inertia
      // (`U` zero), its row of `D` is the identity, so `D^-1` returns its
      // prescribed rate, and the child's momentum along it is `held`.
      const u: number[][] = edge.axes.map((axis: IAxis): number[] =>
        axis.locked === true ? ZERO : multiply(child, axis.column),
      );
      const held: number[][] = edge.axes.map((axis: IAxis): number[] =>
        axis.locked === true ? multiply(child, axis.column) : ZERO,
      );
      const damping: number[] = edge.axes.map((axis: IAxis): number =>
        axis.motor !== undefined &&
        axis.fixed === undefined &&
        axis.locked !== true
          ? h * axis.motor.damping
          : 0,
      );
      // A locked axis's prescribed rate change brings its rate to zero.
      const impulse: number[] = edge.axes.map((axis: IAxis): number =>
        axis.locked === true
          ? -axis.present
          : (axis.fixed ??
            (axis.motor !== undefined
              ? h * axis.motor.damping * (axis.motor.speed - axis.present)
              : 0)),
      );
      const solve: Solve | null =
        edge.axes.length === 0
          ? (right: readonly number[]): number[] => [...right]
          : AutoMovieEngineMath.prepareLinearSystem(
              edge.axes.map((row: IAxis, k: number): number[] =>
                row.locked === true
                  ? u.map((_: number[], l: number): number => (k === l ? 1 : 0))
                  : u.map(
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
      const gain: number[][] = edge.axes.map((_: IAxis, k: number): number[] =>
        columns.map((column: number[]): number => column[k]!),
      );
      edges[index] = { u, held, gain, solve, damping, impulse };
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
    const root: Solve | null = AutoMovieEngineMath.prepareLinearSystem(
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
      // A locked axis moves by its prescribed rate change (with the motors'
      // impulses, else none): the child's articulated momentum gains `I^A s`
      // times it before the free axes and the parent read it.
      const prescribed: number[] = edge.axes.map(
        (axis: IAxis, k: number): number =>
          axis.locked === true && drive ? f.impulse[k]! : 0,
      );
      const child: number[] = bias[edge.child]!.map(
        (value: number, r: number): number => {
          let sum: number = value;
          for (let k: number = 0; k < prescribed.length; ++k)
            sum += f.held[k]![r]! * prescribed[k]!;
          return sum;
        },
      );
      const d: number[] = f.solve(
        edge.axes.map((axis: IAxis, k: number): number =>
          axis.locked === true
            ? prescribed[k]!
            : (drive ? f.impulse[k]! : 0) +
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
      change[0] = factored.root(
        bias[0]!.map((value: number): number => -value),
      );
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
   * A body's spatial inertia about `origin` in world axes, row-major 6x6 over
   * (angular, linear): `[[I_c + m [c]x [c]x^T, m [c]x], [m [c]x^T, m E]]` with
   * `c` its centre relative to `origin` (Featherstone 2008, eq. 2.63); zero for
   * a kinematic body.
   *
   * @param body The body.
   * @param origin The tree's origin, metres.
   * @returns 36 numbers, row-major.
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
   * The spatial impulse about the origin of a linear impulse at a point: `(r x
   * f, f)`.
   *
   * @param point The point relative to the origin, metres.
   * @param force The linear impulse, newton seconds.
   * @returns Six numbers (moment, force).
   */
  export function spatialImpulse(
    point: IAutoMovieVector3,
    force: IAutoMovieVector3,
  ): number[] {
    const moment: IAutoMovieVector3 = Vector3.cross(point, force);
    return [moment.x, moment.y, moment.z, force.x, force.y, force.z];
  }

  /**
   * The velocity change of a point under a body's spatial velocity change:
   * `dv_O + dw x r`.
   *
   * @param change The body's spatial velocity change.
   * @param point The point relative to the origin, metres.
   * @returns Metres per second.
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
  /**
   * The normal impulse a bounded support group's rows may still add over a
   * substep, newton seconds: its force bound over the substep less what the
   * contact passes already gave its patches, and never less than nothing. The
   * bound ramps the force the controller asks of a contact (Herzog et al. 2016,
   * Section 5.3); what the floor's contact gave, as a landing foot's impact, is
   * the floor's, and the controller cannot take it back through the other
   * supports (unilateral contact).
   *
   * @param input The bound, newtons; the substep, seconds; and the impulse the
   *   contact passes gave the group, newton seconds.
   * @returns The impulse left, newton seconds.
   */
  export function room(input: IRoomInput): number {
    return Contacts.room(input);
  }

  /**
   * One support row's unit impulse in IHMC's whole-body objective
   * (`AutoMovieXpbdWorld.IObjective`): its force, its moment about the vertical
   * through the centre of mass when the yaw rate is commanded (develop
   * `LinearMomentumRateControlModule` l.421), and, when its body's contacts
   * count (`WrenchMatrixCalculator.getNextCenterOfPressureInput` l.269-281),
   * its moment about the desired centre of pressure, the two horizontal rows
   * `CoPObjectiveCalculator.computeTask` builds from the wrench in the plane
   * frame (l.24-46: `x_cop J_fz + J_ty` and `y_cop J_fz - J_tx`, the moment
   * about the point on the plane). A torsional row's unit impulse is a moment.
   *
   * @param row The support row.
   * @param point Its point, world metres.
   * @param body The tree body it acts on.
   * @param objective The objective.
   * @returns Its column, the force, the yaw moment if any, then the centre of
   *   pressure's two moments if any.
   */
  export function objectiveRow(
    row: Pick<IRow, "direction" | "moment">,
    point: IAutoMovieVector3,
    body: AutoMovieXpbdBody,
    objective: AutoMovieXpbdWorld.IObjective,
  ): number[] {
    return Contacts.objectiveRow(row, point, body, objective);
  }

  /**
   * The motors' response with the tree held at its pressed supports.
   *
   * @param tree The tree.
   * @param factored Its factor for this substep.
   * @param base The motors' response as if the tree floated.
   * @param contacts The step's contacts.
   * @param h The substep, seconds.
   * @param task The root's momentum task, when the supports should meet one.
   * @param warm The tree's active sets from the previous substep, for the
   *   task's cascade.
   * @returns The combined response with the impulses to record; `base` itself,
   *   recording nothing, when no support takes part or the rows are singular.
   */
  export function solve(
    tree: ITree,
    factored: IFactor,
    base: IResponse,
    contacts: readonly AutoMovieXpbdWorld.IContact[],
    h: number,
    task?: AutoMovieXpbdWorld.IRootTask,
    warm?: AutoMovieXpbdSupportRows.IWarm,
  ): IHeld {
    return Contacts.solve(tree, factored, base, contacts, h, task, warm);
  }

  /**
   * The base response plus each unknown's response times its impulse, and the
   * support rows' records.
   */
  export function combine(
    base: IResponse,
    responses: readonly IResponse[],
    x: readonly number[],
    set: ISet,
  ): IHeld {
    return Contacts.combine(base, responses, x, set);
  }

  /**
   * Record the supports' impulses on their contacts, so the step's receipts
   * carry the momentum they gave: a normal row's impulse joins its point's
   * velocity impulse, a patch's tangential impulse joins its dynamic friction
   * impulse.
   *
   * @param held The solve to record.
   */
  export function commit(held: IHeld): void {
    Contacts.commit(held);
  }

  /**
   * The supports and the motors solved with the root's task, the whole-body
   * contact-wrench quadratic program of humanoid control (Herzog, Rotella,
   * Mason, Grimminger, Schaal and Righetti 2016, "Momentum control with
   * hierarchical inverse dynamics on a torque-controlled humanoid", eqs. 1 to
   * 4; Wensing and Orin 2013, "Generation of dynamic humanoid behaviors through
   * task-space control with conic optimization"), restricted to the root task
   * and solved in factored form: the operational-space responses come from unit
   * test impulses through the articulated-body factor, as Lilly and Orin's
   * direct use of the articulated-body algorithm and Mirtich 1996 compute them
   * (Wensing, Featherstone and Orin 2012 survey the family), not from the
   * joint-space mass matrix.
   *
   * The unknowns are the support rows' impulses and one joint impulse per
   * actuated axis between a pressed support, or a stance body the task names,
   * and the root, each within its motor's cap on either direction. The support
   * chains' own motor impulses leave the base response; what their PDs ask
   * becomes motion instead, each axis's rate after the substep at its servo's
   * speed, with the root's spin at the task's when it asks one. A bounded
   * group's patches give at most its force over the substep. The cascade first
   * brings the ground reaction, the contact passes' impulses plus the rows', as
   * near the task's wrench over the substep as the contacts, cones, caps and
   * bounds allow, then brings the motion as near its targets as it can without
   * giving any of that up (`solveXpbdSupportCascade`).
   *
   * @returns The response with the impulses to record, or null when the cascade
   *   has no feasible point.
   */
  export function solveTask(
    tree: ITree,
    factored: IFactor,
    base: IResponse,
    set: ISet,
    h: number,
    task: AutoMovieXpbdWorld.IRootTask,
    warm: AutoMovieXpbdSupportRows.IWarm,
  ): IHeld | null {
    return Task.solveTask(tree, factored, base, set, h, task, warm);
  }

  /**
   * Solve every motor-driven tree's motors at once and return the joints
   * outside the forest (closing a loop or with a kinematic child), which the
   * caller solves pair by pair.
   *
   * @param joints The world's joints, in creation order.
   * @param h The substep, seconds.
   * @param contacts The step's contacts, for the trees' supports.
   * @param tasks The root tasks the trees' supports should meet, by root body.
   * @param warm Each tree's warm start for its supports' cascade, by root body;
   *   a tree's entry is created on its first task.
   * @returns The joints outside the forest, in creation order.
   */
  export function motors(
    joints: readonly AutoMovieXpbdJoint[],
    h: number,
    contacts: readonly AutoMovieXpbdWorld.IContact[],
    tasks: ReadonlyMap<AutoMovieXpbdBody, AutoMovieXpbdWorld.IRootTask>,
    warm: Map<AutoMovieXpbdBody, AutoMovieXpbdSupportRows.IWarm>,
  ): readonly AutoMovieXpbdJoint[] {
    return Articulation.motors(joints, h, contacts, tasks, warm);
  }

  /**
   * Apply a linear impulse at a point of a body through its whole articulation:
   * the impulse form of the articulated-body algorithm (Featherstone 2008,
   * section 7.5; Mirtich 1996, "Impulse-based dynamic simulation of rigid body
   * systems", chapter 4) gives every body of the body's tree the velocity
   * change that keeps each attachment's anchors together and moves each joint
   * only along its free axes, so a blow on the chest moves the body it is
   * attached to at once, as the joints' impulses carry it, where an impulse on
   * the chest alone sets it moving away from its limbs and leaves the joints'
   * position pass to drag them after it. A body no joint attaches is its own
   * tree, and the change is the rigid body's own.
   *
   * @param joints The world's joints, in creation order.
   * @param body The struck body.
   * @param point The world point the impulse acts at, metres.
   * @param impulse The world linear impulse, newton seconds.
   * @throws {Error} When the struck body's tree has a singular inertia.
   */
  export function impulse(
    joints: readonly AutoMovieXpbdJoint[],
    body: AutoMovieXpbdBody,
    point: IAutoMovieVector3,
    impulse: IAutoMovieVector3,
  ): void {
    Articulation.impulse(joints, body, point, impulse);
  }

  /**
   * The world's forest: each joint whose child is dynamic, has no parent edge
   * yet and lies in another tree than its parent becomes a tree edge.
   *
   * @param joints The world's joints, in creation order.
   * @returns The forest's nodes and the joints outside it.
   */
  export function forest(joints: readonly AutoMovieXpbdJoint[]): IForest {
    return Articulation.forest(joints);
  }

  /** The node's root. */
  export function root(node: INode): INode {
    return Articulation.root(node);
  }

  /**
   * A tree's states and edges, depth-first from its root so every edge follows
   * its parent's.
   */
  export function build(
    top: INode,
    joints?: AutoMovieXpbdJoint[],
  ): ITree {
    return Articulation.build(top, joints);
  }
}
