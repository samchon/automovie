import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { AutoMovieXpbdArticulation } from "./AutoMovieXpbdArticulation";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";
import { AutoMovieXpbdSupportRows as Rows } from "./AutoMovieXpbdSupportRows";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { solveXpbdContacts } from "./solveXpbdContacts";
import { solveXpbdSupportCascade } from "./solveXpbdSupportCascade";
import { solveXpbdSupportComplementarity } from "./solveXpbdSupportComplementarity";

/**
 * The pressed supports of an articulation held inside its motors' solve,
 * by impulse-based articulated contact (Mirtich 1996, "Impulse-based
 * Dynamic Simulation of Rigid Body Systems", chapter 6).
 *
 * The rows are the supports' (`AutoMovieXpbdSupportRows`): a normal row per
 * touching point and two tangential rows per patch. A
 * unit test impulse along every row, propagated through the tree's factor
 * with the motors' damping in it, gives the rows' coupling matrix `K`. A
 * tree with a root task solves the rows and its support chains' joint
 * impulses by the whole-body cascade (`solveXpbdSupportCascade`); any other
 * tree, or one whose cascade has no feasible point, solves `K lambda = -u`,
 * `u` being the motors' velocity change at the rows, as a complementarity
 * problem (`solveXpbdSupportComplementarity`), so the motors move the tree
 * as it is held at its supports instead of as if it floated. Coplanar
 * points make that system rank-deficient, so its diagonal carries a
 * Tikhonov term of `sqrt(eps)` times itself, the float64 scale at which it
 * changes no well-posed solution.
 */
export namespace solveXpbdArticulationContacts {
  /**
   * The normal impulse a bounded support group's rows may still add over a
   * substep, newton seconds: its force bound over the substep less what the
   * contact passes already gave its patches, and never less than nothing. The
   * bound ramps the force the controller asks of a contact (Herzog et al.
   * 2016, Section 5.3); what the floor's contact gave, as a landing foot's
   * impact, is the floor's, and the controller cannot take it back through
   * the other supports (unilateral contact).
   *
   * @param input The bound, newtons; the substep, seconds; and the impulse
   *   the contact passes gave the group, newton seconds.
   * @returns The impulse left, newton seconds.
   */
  export function room(input: { force: number; h: number; given: number }): number {
    return Math.max(0, Math.max(0, input.force) * input.h - input.given);
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
   * @param warm The tree's active sets from the previous substep, for the task's cascade.
   * @returns The combined response with the impulses to record; `base` itself, recording nothing, when no support takes part or the rows are singular.
   */
  export function solve(
    tree: AutoMovieXpbdArticulation.ITree,
    factored: AutoMovieXpbdArticulation.IFactor,
    base: AutoMovieXpbdArticulation.IResponse,
    contacts: readonly solveXpbdContacts.IContact[],
    h: number,
    task?: AutoMovieXpbdWorld.IRootTask,
    warm?: solveXpbdSupportCascade.IWarm,
  ): IHeld {
    const set: ISet = Rows.collect(tree, contacts, h);
    if (set.rows.length === 0) return { response: base, records: [] };
    // Without a feasible cascade this substep, the supports hold the motors'
    // own response, as for a tree without a root task. The task holds only
    // the supports it keeps: a released body's patches are left to the
    // contact passes. Its patches carry their torsional rows, so the ground's
    // moment about the vertical is the task's too.
    if (task !== undefined) {
      const kept: ISet = keep(
        tree,
        Rows.collect(tree, contacts, h, true),
        task.released,
      );
      if (kept.rows.length === 0) return { response: base, records: [] };
      const tasked: IHeld | null = solveTask(
        tree,
        factored,
        base,
        kept,
        h,
        task,
        warm ?? { first: [], second: [] },
      );
      if (tasked !== null) return tasked;
    }
    const responses: AutoMovieXpbdArticulation.IResponse[] = set.rows.map(
      (row: IRow): AutoMovieXpbdArticulation.IResponse =>
        AutoMovieXpbdArticulation.propagate(tree, factored, false, {
          state: row.state,
          impulse: Rows.impulse(row),
        }),
    );
    const k: number[][] = set.rows.map((row: IRow, r: number): number[] =>
      responses.map(
        (response: AutoMovieXpbdArticulation.IResponse, s: number): number => {
          const value: number = Rows.along(row, response);
          return r === s ? value * (1 + REGULARIZATION) : value;
        },
      ),
    );
    const u: number[] = set.rows.map((row: IRow): number =>
      Rows.along(row, base),
    );
    const lambda: number[] | null = solveXpbdSupportComplementarity({
      k,
      u,
      set,
    });
    if (lambda === null) return { response: base, records: [] };
    return combine(base, responses, lambda, set);
  }

  /**
   * The supports and the motors solved with the root's task, the whole-body
   * contact-wrench quadratic program of humanoid control (Herzog, Rotella,
   * Mason, Grimminger, Schaal and Righetti 2016, "Momentum control with
   * hierarchical inverse dynamics on a torque-controlled humanoid", eqs. 1
   * to 4; Wensing and Orin 2013, "Generation of dynamic humanoid behaviors
   * through task-space control with conic optimization"), restricted to the
   * root task and solved in factored form: the operational-space responses
   * come from unit test impulses through the articulated-body factor, as
   * Lilly and Orin's direct use of the articulated-body algorithm and
   * Mirtich 1996 compute them (Wensing, Featherstone and Orin 2012 survey
   * the family), not from the joint-space mass matrix.
   *
   * The unknowns are the support rows' impulses and one joint impulse per
   * actuated axis between a pressed support, or a stance body the task names,
   * and the root, each within its motor's cap on either direction. The support chains' own motor impulses
   * leave the base response; what their PDs ask becomes motion instead, each
   * axis's rate after the substep at its servo's speed, with the root's spin
   * at the task's when it asks one. A bounded group's patches give at most
   * its force over the substep. The cascade first brings the ground
   * reaction, the contact passes' impulses plus the rows', as near the
   * task's wrench over the substep as the contacts, cones, caps and bounds
   * allow, then brings the motion as near its targets as it can without
   * giving any of that up (`solveXpbdSupportCascade`).
   *
   * @returns The response with the impulses to record, or null when the cascade has no feasible point.
   */
  function solveTask(
    tree: AutoMovieXpbdArticulation.ITree,
    factored: AutoMovieXpbdArticulation.IFactor,
    base: AutoMovieXpbdArticulation.IResponse,
    set: ISet,
    h: number,
    task: AutoMovieXpbdWorld.IRootTask,
    warm: solveXpbdSupportCascade.IWarm,
  ): IHeld | null {
    const actuators: IActuator[] = chain(tree, set, h, task.stance ?? []);
    const responses: AutoMovieXpbdArticulation.IResponse[] = [
      ...set.rows.map(
        (row: IRow): AutoMovieXpbdArticulation.IResponse =>
          AutoMovieXpbdArticulation.propagate(tree, factored, false, {
            state: row.state,
            impulse: Rows.impulse(row),
          }),
      ),
      ...actuators.map(
        (actuator: IActuator): AutoMovieXpbdArticulation.IResponse =>
          AutoMovieXpbdArticulation.propagate(
            tree,
            factored,
            false,
            undefined,
            { edge: actuator.edge, axis: actuator.axis, impulse: 1 },
          ),
      ),
    ];
    // The support chains' own motor impulses leave the base response and
    // become the program's unknowns, tracked as its posture objective.
    const drive: number[] = actuators.map(
      (actuator: IActuator): number =>
        factored.edges[actuator.edge]!.impulse[actuator.axis]!,
    );
    const free: AutoMovieXpbdArticulation.IResponse = combine(
      base,
      responses.slice(set.rows.length),
      drive.map((value: number): number => -value),
      { rows: [], patches: [] },
    ).response;
    const k: number[][] = set.rows.map((row: IRow): number[] =>
      responses.map(
        (response: AutoMovieXpbdArticulation.IResponse): number =>
          Rows.along(row, response),
      ),
    );
    const u: number[] = set.rows.map((row: IRow): number =>
      Rows.along(row, free),
    );
    // The ground reaction's rows: force, then moment about the task's
    // origin over the longest lever, so both read in newton seconds.
    const levers: IAutoMovieVector3[] = set.rows.map(
      (row: IRow): IAutoMovieVector3 =>
        Vector3.subtract(Vector3.add(row.point, tree.origin), task.origin),
    );
    const length: number = Math.max(
      Number.EPSILON,
      ...levers.map((lever: IAutoMovieVector3): number => Vector3.length(lever)),
    );
    const wrench = (row: IRow, lever: IAutoMovieVector3): number[] => {
      if (row.moment === true)
        return [
          0,
          0,
          0,
          row.direction.x / length,
          row.direction.y / length,
          row.direction.z / length,
        ];
      const force: IAutoMovieVector3 = row.direction;
      const moment: IAutoMovieVector3 = Vector3.scale(
        Vector3.cross(lever, row.direction),
        1 / length,
      );
      return [force.x, force.y, force.z, moment.x, moment.y, moment.z];
    };
    const columns: number[][] = responses.map(
      (_: AutoMovieXpbdArticulation.IResponse, s: number): number[] =>
        s < set.rows.length
          ? wrench(set.rows[s]!, levers[s]!)
          : [0, 0, 0, 0, 0, 0],
    );
    // The contact passes already gave each pressed point its normal impulse
    // and each patch its friction; the task asks the total.
    let prior: number[] = [0, 0, 0, 0, 0, 0];
    set.rows.forEach((row: IRow, r: number): void => {
      const given: number =
        row.lower !== undefined
          ? -row.lower
          : set.patches.reduce(
              (sum: number, patch: IPatch): number =>
                patch.tangents[0] === r
                  ? sum + patch.prior.first
                  : patch.tangents[1] === r
                    ? sum + patch.prior.second
                    : sum,
              0,
            );
      prior = prior.map(
        (value: number, m: number): number => value + given * columns[r]![m]!,
      );
    });
    const target: number[] = [
      task.force.x * h,
      task.force.y * h,
      task.force.z * h,
      (task.torque.x * h) / length,
      (task.torque.y * h) / length,
      (task.torque.z * h) / length,
    ].map((value: number, m: number): number => value - prior[m]!);
    // A bounded group's normal rows add at most the room its bound leaves
    // (`room`).
    const bounds: solveXpbdSupportCascade.IBound[] = (task.bounds ?? []).map(
      (bound: AutoMovieXpbdWorld.IBound): solveXpbdSupportCascade.IBound => {
        const patches: IPatch[] = set.patches.filter((patch: IPatch): boolean =>
          bound.bodies.includes(
            tree.states[set.rows[patch.normals[0]!]!.state]!.body,
          ),
        );
        return {
          rows: patches.flatMap((patch: IPatch): number[] => patch.normals),
          impulse: solveXpbdArticulationContacts.room({
            force: bound.force,
            h,
            given: patches.reduce(
              (sum: number, patch: IPatch): number => sum + patch.normal,
              0,
            ),
          }),
        };
      },
    );
    // The posture as motion: each support-chain axis's rate after the step
    // should be what its servo asks, and the root's spin what the task asks.
    const motion: solveXpbdSupportCascade.IMotion[] = [
      ...actuators.map(
        (actuator: IActuator): solveXpbdSupportCascade.IMotion => {
          const axis: AutoMovieXpbdArticulation.IAxis =
            tree.edges[actuator.edge]!.axes[actuator.axis]!;
          return {
            weights: responses.map(
              (response: AutoMovieXpbdArticulation.IResponse): number =>
                response.rates[actuator.edge]![actuator.axis]!,
            ),
            value:
              (axis.motor!.target ?? axis.motor!.speed) -
              axis.present -
              free.rates[actuator.edge]![actuator.axis]!,
          };
        },
      ),
      ...(task.spin === undefined
        ? []
        : (["x", "y", "z"] as const).map(
            (name: "x" | "y" | "z", m: number): solveXpbdSupportCascade.IMotion => ({
              weights: responses.map(
                (response: AutoMovieXpbdArticulation.IResponse): number =>
                  response.change[0]![m]!,
              ),
              value:
                task.spin![name] -
                tree.states[0]!.body.angularVelocity[name] -
                free.change[0]![m]!,
            }),
          )),
    ];
    const x: number[] | null = solveXpbdSupportCascade({
      k,
      u,
      columns,
      target,
      set,
      actuators,
      motion,
      bounds: bounds.filter(
        (bound: solveXpbdSupportCascade.IBound): boolean =>
          bound.rows.length > 0,
      ),
      warm,
    });
    if (x === null) return null;
    return combine(free, responses, x, set);
  }

  /**
   * One actuated axis between a pressed support and the root: a joint-impulse unknown.
   */
  export interface IActuator {
    /** The edge's index in the tree's edges. */
    edge: number;

    /** The axis's index in the edge's axes. */
    axis: number;

    /** Its motor's cap toward the axis's positive direction over the substep, newton metre seconds. */
    cap: number;

    /** Its motor's cap toward the axis's negative direction over the substep, newton metre seconds. */
    reverse: number;
  }

  /**
   * The actuated axes on the chains from the pressed supports, and from the
   * task's stance bodies whether or not they press, to the root.
   */
  function chain(
    tree: AutoMovieXpbdArticulation.ITree,
    set: ISet,
    h: number,
    stance: readonly AutoMovieXpbdBody[],
  ): IActuator[] {
    const into: Map<number, number> = new Map(
      tree.edges.map(
        (edge: AutoMovieXpbdArticulation.IEdge, index: number): [number, number] => [
          edge.child,
          index,
        ],
      ),
    );
    const edges: Set<number> = new Set();
    const starts: number[] = [
      ...set.rows.map((row: IRow): number => row.state),
      ...stance
        .map((body: AutoMovieXpbdBody): number =>
          tree.states.findIndex(
            (state: AutoMovieXpbdArticulation.IState): boolean =>
              state.body === body,
          ),
        )
        .filter((state: number): boolean => state >= 0),
    ];
    for (const start of starts) {
      let state: number = start;
      let edge: number | undefined = into.get(state);
      while (edge !== undefined && !edges.has(edge)) {
        edges.add(edge);
        state = tree.edges[edge]!.parent;
        edge = into.get(state);
      }
    }
    return [...edges]
      .sort((a: number, b: number): number => a - b)
      .flatMap((edge: number): IActuator[] =>
        tree.edges[edge]!.axes.flatMap(
          (axis: AutoMovieXpbdArticulation.IAxis, index: number): IActuator[] =>
            axis.motor === undefined
              ? []
              : [
                  {
                    edge,
                    axis: index,
                    cap: AutoMovieXpbdJoint.cap(axis.motor, 1, h),
                    reverse: AutoMovieXpbdJoint.cap(axis.motor, -1, h),
                  },
                ],
        ),
      );
  }

  /**
   * The set without the patches of released bodies, its rows renumbered in
   * order; the set itself when none is released.
   */
  function keep(
    tree: AutoMovieXpbdArticulation.ITree,
    set: ISet,
    released: ReadonlySet<AutoMovieXpbdBody> | undefined,
  ): ISet {
    if (released === undefined || released.size === 0) return set;
    const kept: ISet = { rows: [], patches: [] };
    for (const patch of set.patches) {
      if (released.has(tree.states[set.rows[patch.normals[0]!]!.state]!.body))
        continue;
      const copy = (r: number): number => {
        kept.rows.push(set.rows[r]!);
        return kept.rows.length - 1;
      };
      const { torsion, ...rest }: IPatch = patch;
      kept.patches.push({
        ...rest,
        normals: patch.normals.map(copy),
        tangents: patch.tangents.map(copy),
        ...(torsion !== undefined ? { torsion: copy(torsion) } : {}),
      });
    }
    return kept;
  }

  /** The base response plus each unknown's response times its impulse, and the support rows' records. */
  function combine(
    base: AutoMovieXpbdArticulation.IResponse,
    responses: readonly AutoMovieXpbdArticulation.IResponse[],
    x: readonly number[],
    set: ISet,
  ): IHeld {
    const records: IRecord[] = [];
    for (const patch of set.patches) {
      for (const r of patch.normals)
        records.push({
          contact: set.rows[r]!.contact,
          normal: true,
          impulse: x[r]!,
        });
      records.push({
        contact: set.rows[patch.tangents[0]!]!.contact,
        normal: false,
        impulse: Math.hypot(x[patch.tangents[0]!]!, x[patch.tangents[1]!]!),
      });
    }
    const response: AutoMovieXpbdArticulation.IResponse = {
      change: base.change.map((change: number[], i: number): number[] =>
        change.map((value: number, m: number): number => {
          let sum: number = value;
          responses.forEach(
            (each: AutoMovieXpbdArticulation.IResponse, s: number): void => {
              sum += x[s]! * each.change[i]![m]!;
            },
          );
          return sum;
        }),
      ),
      rates: base.rates.map((rates: number[], e: number): number[] =>
        rates.map((value: number, a: number): number => {
          let sum: number = value;
          responses.forEach(
            (each: AutoMovieXpbdArticulation.IResponse, s: number): void => {
              sum += x[s]! * each.rates[e]![a]!;
            },
          );
          return sum;
        }),
      ),
    };
    return { response, records };
  }

  /**
   * Record the supports' impulses on their contacts, so the step's
   * receipts carry the momentum they gave: a normal row's impulse joins its
   * point's velocity impulse, a patch's tangential impulse joins its
   * dynamic friction impulse.
   *
   * @param held The solve to record.
   */
  export function commit(held: IHeld): void {
    for (const record of held.records)
      if (record.normal) record.contact.velocityImpulse += record.impulse;
      else record.contact.tangentImpulse += record.impulse;
  }

  /**
   * A support solve: the combined response and the impulses to record on
   * the contacts once it is final.
   */
  export interface IHeld {
    /** The motors' response with the supports' impulses added. */
    response: AutoMovieXpbdArticulation.IResponse;

    /** The supports' impulses to record on their contacts. */
    records: IRecord[];
  }

  /**
   * One support impulse to record.
   */
  export interface IRecord {
    /** The contact recorded on. */
    contact: solveXpbdContacts.IContact;

    /** Whether the impulse is a normal row's; a patch's tangential magnitude otherwise. */
    normal: boolean;

    /** The impulse, newton seconds. */
    impulse: number;
  }

  /**
   * One contact row: a unit force along a direction at a point of one tree
   * body.
   */
  export interface IRow {
    /** The body's index in the tree's states. */
    state: number;

    /** The point relative to the tree's origin, metres. */
    point: IAutoMovieVector3;

    /** Unit world direction of the force on the tree body. */
    direction: IAutoMovieVector3;

    /** The least impulse of a normal row, newton seconds; absent for a tangential or torsional row. */
    lower?: number;

    /** Whether the row is a unit moment about the direction, a patch's torsional friction, rather than a force at the point. */
    moment?: boolean;

    /** The present velocity along the direction relative to the other side, metres per second. */
    velocity: number;

    /** The contact the row records on: its point for a normal row, its patch's first otherwise. */
    contact: solveXpbdContacts.IContact;
  }

  /**
   * One taking-part patch's rows and friction.
   */
  export interface IPatch {
    /** The patch's Coulomb coefficient. */
    friction: number;

    /** The normal impulse the contact passes gave the patch this substep, `sum (lambda_n / h + velocity impulse)`, the part of the normal its whole friction is bounded by that the rows do not add, newton seconds. */
    normal: number;

    /** The friction the contact passes already gave the tree body, on the two tangential rows' directions, newton seconds. */
    prior: ISlip;

    /** Its normal rows' indices. */
    normals: number[];

    /** Its two tangential rows' indices. */
    tangents: number[];

    /** Its torsional row's index, when the set carries one. */
    torsion?: number;
  }

  /**
   * The rows and patches of one tree.
   */
  export interface ISet {
    /** Every row. */
    rows: IRow[];

    /** Every patch. */
    patches: IPatch[];
  }

  /**
   * A pair of values on a patch's two tangential rows: a sliding direction or a friction impulse.
   */
  export interface ISlip {
    /** Along the first tangential row. */
    first: number;

    /** Along the second tangential row. */
    second: number;
  }

  /** The Tikhonov weight on K's diagonal: the square root of float64's machine epsilon. */
  const REGULARIZATION: number = Math.sqrt(Number.EPSILON);
}
