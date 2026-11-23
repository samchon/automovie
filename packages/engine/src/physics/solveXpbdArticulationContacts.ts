import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { AutoMovieXpbdArticulation } from "./AutoMovieXpbdArticulation";
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the source, the rows, the test impulses, both solves and the regularization.
 * @evidence contracts/development/design.md#principled-representation A namespace over one tree's factor and the step's contacts; impulses in newton seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One entry and its record, called by solveXpbdArticulation for each motor-driven tree; the row types shared with the rows' owner and both solves.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Bounds and coefficients are the contacts'; nothing is tuned here.
 */
export namespace solveXpbdArticulationContacts {
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is returned and both fallbacks.
   * @evidence contracts/development/implementation.md#principled-implementation Mirtich 1996, chapter 6: K from unit test impulses through the articulated-body algorithm, then the cascade with a task or the complementarity solve without one.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Collect rows, then the task's cascade, else propagate tests, assemble K, solve, combine.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A singular system leaves the floating response instead of dividing.
   * @evidence contracts/development/implementation.md#efficient-algorithms One propagation (two linear sweeps) per row, then one of the two solves over the rows.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every test impulse reuses the tree's one factor.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh arrays; retains nothing.
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
    // own response, as for a tree without a root task.
    if (task !== undefined) {
      const tasked: IHeld | null = solveTask(
        tree,
        factored,
        base,
        set,
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
   * actuated axis between a pressed support and the root, each within its
   * motor's cap. The support chains' own motor impulses leave the base
   * response and become those unknowns' posture targets. The strict
   * two-level cascade first brings the ground reaction, the contact passes'
   * impulses plus the rows', as near the task's wrench over the substep as
   * the contacts, cones and caps allow, then tracks the posture targets
   * without giving any of that up.
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
    const actuators: IActuator[] = chain(tree, set, h);
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
    const x: number[] | null = solveXpbdSupportCascade({
      k,
      u,
      columns,
      target,
      set,
      actuators,
      posture: drive,
      warm,
    });
    if (x === null) return null;
    return combine(free, responses, x, set);
  }

  /**
   * One actuated axis between a pressed support and the root: a joint-impulse unknown.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the edge, the axis and the cap.
   * @evidence contracts/development/design.md#principled-representation Indices into the tree and a cap in newton metre seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built here and read by solveXpbdSupportCascade.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The cap is the motor's own over the substep.
   */
  export interface IActuator {
    /** The edge's index in the tree's edges. */
    edge: number;

    /** The axis's index in the edge's axes. */
    axis: number;

    /** Its motor's cap over the substep, newton metre seconds. */
    cap: number;
  }

  /** The actuated axes on the chains from the pressed supports to the root. */
  function chain(
    tree: AutoMovieXpbdArticulation.ITree,
    set: ISet,
    h: number,
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
    for (const row of set.rows) {
      let state: number = row.state;
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
              : [{ edge, axis: index, cap: axis.motor.maximumTorque * h }],
        ),
      );
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each row adds to and why.
   * @evidence contracts/development/implementation.md#principled-implementation A support's impulse is momentum the contact gave, so it belongs to the contact's own accumulators that the receipts read.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the final solve is recorded, after the caps settle.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the records.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each record is written once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Mutates only the step's contacts; retains nothing.
   */
  export function commit(held: IHeld): void {
    for (const record of held.records)
      if (record.normal) record.contact.velocityImpulse += record.impulse;
      else record.contact.tangentImpulse += record.impulse;
  }

  /**
   * A support solve: the combined response and the impulses to record on
   * the contacts once it is final.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both parts.
   * @evidence contracts/development/design.md#principled-representation A response and impulse records in newton seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by solve, applied by the caller and recorded by commit.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The response stays separate from recording, so a solve the caps redo is never recorded.
   */
  export interface IHeld {
    /** The motors' response with the supports' impulses added. */
    response: AutoMovieXpbdArticulation.IResponse;

    /** The supports' impulses to record on their contacts. */
    records: IRecord[];
  }

  /**
   * One support impulse to record.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the contact, the kind and the amount.
   * @evidence contracts/development/design.md#principled-representation The contact record, whether it is a normal row, and the impulse in newton seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by solve and read by commit.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A patch records its tangential magnitude on its first contact, where the contact passes keep the patch's friction.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the body, point, direction, bound, velocity and contact.
   * @evidence contracts/development/design.md#principled-representation Tree indices, metres from the tree origin, a unit direction and newton seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by AutoMovieXpbdSupportRows.collect and read by the solves here, by solveXpbdSupportCascade and by solveXpbdSupportComplementarity.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values are the contacts' own.
   */
  export interface IRow {
    /** The body's index in the tree's states. */
    state: number;

    /** The point relative to the tree's origin, metres. */
    point: IAutoMovieVector3;

    /** Unit world direction of the force on the tree body. */
    direction: IAutoMovieVector3;

    /** The least impulse of a normal row, newton seconds; absent for a tangential row. */
    lower?: number;

    /** The present velocity along the direction relative to the other side, metres per second. */
    velocity: number;

    /** The contact the row records on: its point for a normal row, its patch's first otherwise. */
    contact: solveXpbdContacts.IContact;
  }

  /**
   * One taking-part patch's rows and friction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the friction, the given normal, the prior friction and the rows.
   * @evidence contracts/development/design.md#principled-representation A coefficient, newton seconds and row indices.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by AutoMovieXpbdSupportRows.collect and read by both solves.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values are the contacts' own.
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

  }

  /**
   * The rows and patches of one tree.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rows and the patches.
   * @evidence contracts/development/design.md#principled-representation Two arrays; patches index the rows.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by AutoMovieXpbdSupportRows.collect and read by both solves.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values are the contacts' own.
   */
  export interface ISet {
    /** Every row. */
    rows: IRow[];

    /** Every patch. */
    patches: IPatch[];
  }

  /**
   * A pair of values on a patch's two tangential rows: a sliding direction or a friction impulse.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both members.
   * @evidence contracts/development/design.md#principled-representation Two components on the rows' tangent directions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by AutoMovieXpbdSupportRows.collect and solveXpbdSupportComplementarity; read by solveXpbdSupportCascade through IPatch.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No unit is implied beyond the owner's.
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
