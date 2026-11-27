import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { AutoMovieEngineXpbdArticulation } from "../AutoMovieEngineXpbdArticulation";
import type { AutoMovieEngineXpbdBody } from "../AutoMovieEngineXpbdBody";
import { AutoMovieEngineXpbdSupportRows as Rows } from "../AutoMovieEngineXpbdSupportRows";
import type { AutoMovieEngineXpbdWorld } from "../AutoMovieEngineXpbdWorld";
import { solveXpbdArticulationTask as Task } from "./solveXpbdArticulationTask";
import type { solveXpbdContacts } from "./solveXpbdContacts";
import { solveXpbdSupportCascade } from "./solveXpbdSupportCascade";
import { solveXpbdSupportComplementarity } from "./solveXpbdSupportComplementarity";

/*
 * The pressed supports of an articulation held inside its motors' solve, by
 * impulse-based articulated contact (Mirtich 1996, "Impulse-based Dynamic
 * Simulation of Rigid Body Systems", chapter 6).
 *
 * The rows are the supports' (`AutoMovieEngineXpbdSupportRows`): a normal row per
 * touching point and two tangential rows per patch. A unit test impulse along
 * every row, propagated through the tree's factor with the motors' damping in
 * it, gives the rows' coupling matrix `K`. A tree with a root task solves the
 * rows and its support chains' joint impulses by the whole-body cascade
 * (`solveXpbdSupportCascade`); any other tree, or one whose cascade has no
 * feasible point, solves `K lambda = -u`, `u` being the motors' velocity change
 * at the rows, as a complementarity problem
 * (`solveXpbdSupportComplementarity`), so the motors move the tree as it is
 * held at its supports instead of as if it floated. Coplanar points make that
 * system rank-deficient, so its diagonal carries a Tikhonov term of `sqrt(eps)`
 * times itself, the float64 scale at which it changes no well-posed solution.
 */
export namespace solveXpbdArticulationContacts {
  /*
   * The normal impulse a bounded support group's rows may still add over a
   * substep, newton seconds: its force bound over the substep less what the
   * contact passes already gave its patches, and never less than nothing. The
   * bound ramps the force the controller asks of a contact (Herzog et al. 2016,
   * Section 5.3); what the floor's contact gave, as a landing foot's impact, is
   * the floor's, and the controller cannot take it back through the other
   * supports (unilateral contact).
   * Parameter input: The bound, newtons; the substep, seconds; and the impulse the
   * contact passes gave the group, newton seconds.
   * Returns: The impulse left, newton seconds.
   */
  export function room(input: {
    force: number;
    h: number;
    given: number;
  }): number {
    return Math.max(0, Math.max(0, input.force) * input.h - input.given);
  }

  /*
   * One support row's unit impulse in IHMC's whole-body objective
   * (`AutoMovieEngineXpbdWorld.IObjective`): its force, its moment about the vertical
   * through the centre of mass when the yaw rate is commanded (develop
   * `LinearMomentumRateControlModule` l.421), and, when its body's contacts
   * count (`WrenchMatrixCalculator.getNextCenterOfPressureInput` l.269-281),
   * its moment about the desired centre of pressure, the two horizontal rows
   * `CoPObjectiveCalculator.computeTask` builds from the wrench in the plane
   * frame (l.24-46: `x_cop J_fz + J_ty` and `y_cop J_fz - J_tx`, the moment
   * about the point on the plane). A torsional row's unit impulse is a moment.
   * Parameter row: The support row.
   * Parameter point: Its point, world metres.
   * Parameter body: The tree body it acts on.
   * Parameter objective: The objective.
   * Returns: Its column, the force, the yaw moment if any, then the centre of
   * pressure's two moments if any.
   */
  export function objectiveRow(
    row: Pick<IRow, "direction" | "moment">,
    point: IAutoMovieVector3,
    body: AutoMovieEngineXpbdBody,
    objective: AutoMovieEngineXpbdWorld.IObjective,
  ): number[] {
    const d: IAutoMovieVector3 = row.direction;
    const about = (center: IAutoMovieVector3): IAutoMovieVector3 =>
      row.moment === true
        ? d
        : AutoMovieEngineVector3.cross(AutoMovieEngineVector3.subtract(point, center), d);
    const force: number[] = row.moment === true ? [0, 0, 0] : [d.x, d.y, d.z];
    const yaw: number[] = objective.yaw ? [about(objective.yaw.center).y] : [];
    const pressure = objective.pressure;
    const counted: boolean =
      pressure !== undefined &&
      (pressure.bodies === undefined || pressure.bodies.includes(body));
    const moment: IAutoMovieVector3 | undefined =
      pressure && counted ? about(pressure.point) : undefined;
    return [
      ...force,
      ...yaw,
      ...(pressure ? (moment ? [moment.x, moment.z] : [0, 0]) : []),
    ];
  }

  /*
   * The motors' response with the tree held at its pressed supports.
   * Parameter tree: The tree.
   * Parameter factored: Its factor for this substep.
   * Parameter base: The motors' response as if the tree floated.
   * Parameter contacts: The step's contacts.
   * Parameter h: The substep, seconds.
   * Parameter task: The root's momentum task, when the supports should meet one.
   * Parameter warm: The tree's active sets from the previous substep, for the
   * task's cascade.
   * Returns: The combined response with the impulses to record; `base` itself,
   * recording nothing, when no support takes part or the rows are singular.
   */
  export function solve(
    tree: AutoMovieEngineXpbdArticulation.ITree,
    factored: AutoMovieEngineXpbdArticulation.IFactor,
    base: AutoMovieEngineXpbdArticulation.IResponse,
    contacts: readonly solveXpbdContacts.IContact[],
    h: number,
    task?: AutoMovieEngineXpbdWorld.IRootTask,
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
      const tasked: IHeld | null = Task.solveTask(
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
    const responses: AutoMovieEngineXpbdArticulation.IResponse[] = set.rows.map(
      (row: IRow): AutoMovieEngineXpbdArticulation.IResponse =>
        AutoMovieEngineXpbdArticulation.propagate(tree, factored, false, {
          state: row.state,
          impulse: Rows.impulse(row),
        }),
    );
    const k: number[][] = set.rows.map((row: IRow, r: number): number[] =>
      responses.map(
        (response: AutoMovieEngineXpbdArticulation.IResponse, s: number): number => {
          const value: number = Rows.along(row, response);
          return r === s ? value * (1 + REGULARIZATION) : value;
        },
      ),
    );
    const u: number[] = set.rows.map((row: IRow): number =>
      Rows.along(row, base),
    );
    const lambda: number[] | null = solveXpbdSupportComplementarity.run({
      k,
      u,
      set,
    });
    if (lambda === null) return { response: base, records: [] };
    return combine(base, responses, lambda, set);
  }

  /**
   * One actuated axis between a pressed support and the root: a joint-impulse
   * unknown.
   */
  export interface IActuator {
    /** The edge's index in the tree's edges. */
    edge: number;

    /** The axis's index in the edge's axes. */
    axis: number;

    /**
     * Its motor's cap toward the axis's positive direction over the substep,
     * newton metre seconds.
     */
    cap: number;

    /**
     * Its motor's cap toward the axis's negative direction over the substep,
     * newton metre seconds.
     */
    reverse: number;
  }

  /*
   * The base response plus each unknown's response times its impulse, and the
   * support rows' records.
   */
  export function combine(
    base: AutoMovieEngineXpbdArticulation.IResponse,
    responses: readonly AutoMovieEngineXpbdArticulation.IResponse[],
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
    const response: AutoMovieEngineXpbdArticulation.IResponse = {
      change: base.change.map((change: number[], i: number): number[] =>
        change.map((value: number, m: number): number => {
          let sum: number = value;
          responses.forEach(
            (each: AutoMovieEngineXpbdArticulation.IResponse, s: number): void => {
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
            (each: AutoMovieEngineXpbdArticulation.IResponse, s: number): void => {
              sum += x[s]! * each.rates[e]![a]!;
            },
          );
          return sum;
        }),
      ),
    };
    return { response, records };
  }

  /*
   * Record the supports' impulses on their contacts, so the step's receipts
   * carry the momentum they gave: a normal row's impulse joins its point's
   * velocity impulse, a patch's tangential impulse joins its dynamic friction
   * impulse.
   * Parameter held: The solve to record.
   */
  export function commit(held: IHeld): void {
    for (const record of held.records)
      if (record.normal) record.contact.velocityImpulse += record.impulse;
      else record.contact.tangentImpulse += record.impulse;
  }

  /**
   * A support solve: the combined response and the impulses to record on the
   * contacts once it is final.
   */
  export interface IHeld {
    /** The motors' response with the supports' impulses added. */
    response: AutoMovieEngineXpbdArticulation.IResponse;

    /** The supports' impulses to record on their contacts. */
    records: IRecord[];
  }

  /** One support impulse to record. */
  export interface IRecord {
    /** The contact recorded on. */
    contact: solveXpbdContacts.IContact;

    /**
     * Whether the impulse is a normal row's; a patch's tangential magnitude
     * otherwise.
     */
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

    /**
     * The least impulse of a normal row, newton seconds; absent for a
     * tangential or torsional row.
     */
    lower?: number;

    /**
     * Whether the row is a unit moment about the direction, a patch's torsional
     * friction, rather than a force at the point.
     */
    moment?: boolean;

    /**
     * The present velocity along the direction relative to the other side,
     * metres per second.
     */
    velocity: number;

    /**
     * The contact the row records on: its point for a normal row, its patch's
     * first otherwise.
     */
    contact: solveXpbdContacts.IContact;
  }

  /** One taking-part patch's rows and friction. */
  export interface IPatch {
    /** The patch's Coulomb coefficient. */
    friction: number;

    /**
     * The normal impulse the contact passes gave the patch this substep, `sum
     * (lambda_n / h + velocity impulse)`, the part of the normal its whole
     * friction is bounded by that the rows do not add, newton seconds.
     */
    normal: number;

    /**
     * The friction the contact passes already gave the tree body, on the two
     * tangential rows' directions, newton seconds.
     */
    prior: ISlip;

    /** Its normal rows' indices. */
    normals: number[];

    /** Its two tangential rows' indices. */
    tangents: number[];

    /** Its torsional row's index, when the set carries one. */
    torsion?: number;
  }

  /** The rows and patches of one tree. */
  export interface ISet {
    /** Every row. */
    rows: IRow[];

    /** Every patch. */
    patches: IPatch[];
  }

  /**
   * A pair of values on a patch's two tangential rows: a sliding direction or a
   * friction impulse.
   */
  export interface ISlip {
    /** Along the first tangential row. */
    first: number;

    /** Along the second tangential row. */
    second: number;
  }

  /*
   * The set without the patches of released bodies, its rows renumbered in
   * order; the set itself when none is released.
   */
  function keep(
    tree: AutoMovieEngineXpbdArticulation.ITree,
    set: ISet,
    released: ReadonlySet<AutoMovieEngineXpbdBody> | undefined,
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

  /*
   * The Tikhonov weight on K's diagonal: the square root of float64's machine
   * epsilon.
   */
  const REGULARIZATION: number = Math.sqrt(Number.EPSILON);
}
