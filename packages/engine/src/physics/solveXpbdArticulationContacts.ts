import type { IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { prepareLinearSystem } from "../math/prepareLinearSystem";
import { AutoMovieXpbdArticulation } from "./AutoMovieXpbdArticulation";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { solveXpbdContacts } from "./solveXpbdContacts";
import { solveXpbdSupportCascade } from "./solveXpbdSupportCascade";

/**
 * The pressed supports of an articulation held inside its motors' solve,
 * by impulse-based articulated contact (Mirtich 1996, "Impulse-based
 * Dynamic Simulation of Rigid Body Systems", chapter 6).
 *
 * A patch takes part when one side is a body of the tree and the other is
 * not dynamic (the floor, a kinematic prop), with its points the step
 * pressed (`normalLambda > 0`) and those touching inside the allowed depth,
 * which a sequential-impulse solver's velocity rows also cover (Catto 2006,
 * "Fast and Simple Physics using Sequential Impulses"). Each such
 * point gives a normal row along its push direction and each patch two
 * tangential rows at its points' centroid (patch friction). A unit test
 * impulse along every row, propagated through the tree's factor with the
 * motors' damping in it, gives the rows' coupling matrix `K`; the rows'
 * impulses `lambda` solve `K lambda = -u`, `u` being the motors' velocity
 * change at the rows, so the motors move the tree as it is held at its
 * supports instead of as if it floated. A normal row only pushes: one whose
 * impulse would take back more than the step's position and velocity
 * passes gave is held at that bound and the rest solved again, and is
 * released when, held, its point would approach (Signorini). A patch whose
 * whole friction, the contact passes' plus the rows', leaves its cone
 * `mu (N + sum lambda_n)`, with `N` the normal impulse the contact passes
 * gave the patch, positional and velocity (`lambda_n / h` plus the velocity
 * impulse, the same total the Signorini bound reads), slides along the
 * direction it left in, with
 * the cone's impulse written as rows linear in its normals, so the normals
 * are solved with the friction they get. Coplanar points make the normal rows rank-deficient, so the
 * diagonal carries a Tikhonov term of `sqrt(eps)` times itself, the
 * float64 scale at which it changes no well-posed solution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the source, which patches and points take part, the rows, the test impulses, the unilateral bound, the sliding cone and the regularization.
 * @evidence contracts/development/design.md#principled-representation A namespace over one tree's factor and the step's contacts; impulses in newton seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One entry, called by solveXpbdArticulation for each motor-driven tree.
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
   * @evidence contracts/development/implementation.md#principled-implementation Mirtich 1996, chapter 6: K from unit test impulses through the articulated-body algorithm, K lambda = -u solved as a complementarity problem by active set: normal rows held at and released from their Signorini bound, a patch leaving its Coulomb cone sliding with impulse rows linear in its normals.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Collect rows, propagate tests, assemble K, active-set solve, combine.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A singular system leaves the floating response instead of dividing.
   * @evidence contracts/development/implementation.md#efficient-algorithms One propagation (two linear sweeps) per row, a dense solve over the rows per active-set round, at most twice the rows' count of rounds.
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
    const set: ISet = collect(tree, contacts, h);
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
          impulse: AutoMovieXpbdArticulation.spatialImpulse(
            row.point,
            row.direction,
          ),
        }),
    );
    const k: number[][] = set.rows.map((row: IRow, r: number): number[] =>
      responses.map(
        (response: AutoMovieXpbdArticulation.IResponse, s: number): number => {
          const value: number = along(row, response);
          return r === s ? value * (1 + REGULARIZATION) : value;
        },
      ),
    );
    const u: number[] = set.rows.map((row: IRow): number => along(row, base));
    const lambda: number[] | null = activeSet(k, u, set);
    if (lambda === null) return { response: base, records: [] };
    const records: IRecord[] = [];
    for (const patch of set.patches) {
      for (const r of patch.normals)
        records.push({
          contact: set.rows[r]!.contact,
          normal: true,
          impulse: lambda[r]!,
        });
      records.push({
        contact: set.rows[patch.tangents[0]!]!.contact,
        normal: false,
        impulse: Math.hypot(
          lambda[patch.tangents[0]!]!,
          lambda[patch.tangents[1]!]!,
        ),
      });
    }
    const response: AutoMovieXpbdArticulation.IResponse = {
      change: base.change.map((change: number[], i: number): number[] =>
        change.map((value: number, m: number): number => {
          let sum: number = value;
          responses.forEach(
            (response: AutoMovieXpbdArticulation.IResponse, s: number): void => {
              sum += lambda[s]! * response.change[i]![m]!;
            },
          );
          return sum;
        }),
      ),
      rates: base.rates.map((rates: number[], e: number): number[] =>
        rates.map((value: number, k: number): number => {
          let sum: number = value;
          responses.forEach(
            (response: AutoMovieXpbdArticulation.IResponse, s: number): void => {
              sum += lambda[s]! * response.rates[e]![k]!;
            },
          );
          return sum;
        }),
      ),
    };
    return { response, records };
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
   * two-level cascade (`cascade`) first brings the ground reaction, the
   * contact passes' impulses plus the rows', as near the task's wrench over
   * the substep as the contacts, cones and caps allow, then tracks the
   * posture targets without giving any of that up.
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
            impulse: AutoMovieXpbdArticulation.spatialImpulse(
              row.point,
              row.direction,
            ),
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
          along(row, response),
      ),
    );
    const u: number[] = set.rows.map((row: IRow): number => along(row, free));
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
    const wrench: (
      direction: IAutoMovieVector3,
      lever: IAutoMovieVector3,
    ) => number[] = (
      direction: IAutoMovieVector3,
      lever: IAutoMovieVector3,
    ): number[] => {
      const moment: IAutoMovieVector3 = Vector3.scale(
        Vector3.cross(lever, direction),
        1 / length,
      );
      return [
        direction.x,
        direction.y,
        direction.z,
        moment.x,
        moment.y,
        moment.z,
      ];
    };
    const columns: number[][] = responses.map(
      (_: AutoMovieXpbdArticulation.IResponse, s: number): number[] =>
        s < set.rows.length
          ? wrench(set.rows[s]!.direction, levers[s]!)
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
   * One contact row: a unit impulse direction at a point of one tree body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the body, point, direction, bound and contact.
   * @evidence contracts/development/design.md#principled-representation Tree indices, metres from the tree origin, a unit direction and newton seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by collect and read by the solves here and by solveXpbdSupportCascade.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values are the contacts' own.
   */
  export interface IRow {
    /** The body's index in the tree's states. */
    state: number;

    /** The point relative to the tree's origin, metres. */
    point: IAutoMovieVector3;

    /** Unit world direction of the impulse on the tree body. */
    direction: IAutoMovieVector3;

    /** The least impulse of a normal row, newton seconds; absent for a tangential row. */
    lower?: number;

    /** The point's present velocity along the direction, relative to the other side, metres per second. */
    velocity: number;

    /** The contact the row records on: its point for a normal row, its patch's first for a tangential one. */
    contact: solveXpbdContacts.IContact;
  }

  /**
   * One taking-part patch's rows and friction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the friction, the given normal, the prior friction and the rows.
   * @evidence contracts/development/design.md#principled-representation A coefficient, newton seconds and row indices.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by collect and read by the solves here and by solveXpbdSupportCascade.
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
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by collect and read by the solves here and by solveXpbdSupportCascade.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values are the contacts' own.
   */
  export interface ISet {
    /** Every row. */
    rows: IRow[];

    /** Every patch. */
    patches: IPatch[];
  }

  /** The tree's pressed supports on non-dynamic bodies, as rows. */
  function collect(
    tree: AutoMovieXpbdArticulation.ITree,
    contacts: readonly solveXpbdContacts.IContact[],
    h: number,
  ): ISet {
    const index: Map<AutoMovieXpbdBody, number> = new Map();
    tree.states.forEach(
      (state: AutoMovieXpbdArticulation.IState, i: number): void => {
        if (state.body.dynamic) index.set(state.body, i);
      },
    );
    const set: ISet = { rows: [], patches: [] };
    for (const patch of solveXpbdContacts.manifolds(contacts)) {
      const head: solveXpbdContacts.IContact = patch[0]!;
      const first: number | undefined = index.get(head.a.body);
      const second: number | undefined = index.get(head.b.body);
      const onFirst: boolean = first !== undefined && !head.b.body.dynamic;
      const onSecond: boolean = second !== undefined && !head.a.body.dynamic;
      if (!onFirst && !onSecond) continue;
      // A point inside the position pass's allowed depth touches without
      // being corrected; it is a contact of the velocity level all the
      // same, as a sequential-impulse solver's velocity rows cover the
      // points inside its allowed penetration (Catto 2006, "Fast and Simple
      // Physics using Sequential Impulses"), so the motors may not drive it
      // into the floor.
      const pressed: solveXpbdContacts.IContact[] = patch.filter(
        (contact: solveXpbdContacts.IContact): boolean =>
          contact.normalLambda > 0 || contact.separation <= 0,
      );
      if (pressed.length === 0) continue;
      const state: number = onFirst ? first! : second!;
      const body: AutoMovieXpbdBody = tree.states[state]!.body;
      // The normal points from the first collider toward the second.
      const push: IAutoMovieVector3 = Vector3.scale(
        head.normal,
        onFirst ? -1 : 1,
      );
      // The contact passes' friction on the first body: the positional
      // multiplier over the substep and the velocity passes' impulse.
      const prior: IAutoMovieVector3 = Vector3.scale(
        Vector3.add(
          Vector3.scale(head.tangentLambda, 1 / h),
          head.frictionImpulse,
        ),
        onFirst ? 1 : -1,
      );
      // The tree body's present velocity at a point, relative to the other
      // side's, along a direction: what a hold must bring to rest.
      const other: AutoMovieXpbdBody = onFirst ? head.b.body : head.a.body;
      const relative = (
        point: IAutoMovieVector3,
        direction: IAutoMovieVector3,
      ): number => {
        const at: IAutoMovieVector3 = Vector3.add(point, tree.origin);
        return Vector3.dot(
          direction,
          Vector3.subtract(body.velocityAtPoint(at), other.velocityAtPoint(at)),
        );
      };
      const basis: IAutoMovieVector3[] = tangents(push);
      const t1: IAutoMovieVector3 = basis[0]!;
      const t2: IAutoMovieVector3 = basis[1]!;
      const entry: IPatch = {
        friction: head.friction,
        normal: pressed.reduce(
          (sum: number, contact: solveXpbdContacts.IContact): number =>
            sum + contact.normalLambda / h + contact.velocityImpulse,
          0,
        ),
        prior: {
          first: Vector3.dot(prior, t1),
          second: Vector3.dot(prior, t2),
        },
        normals: [],
        tangents: [],
      };
      let centroid: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      for (const contact of pressed) {
        const point: IAutoMovieVector3 = Vector3.subtract(
          Vector3.add(
            body.center,
            Quaternion.rotateVector(
              body.orientation,
              onFirst ? contact.localA : contact.localB,
            ),
          ),
          tree.origin,
        );
        const given: number = contact.normalLambda / h + contact.velocityImpulse;
        centroid = Vector3.add(centroid, point);
        entry.normals.push(set.rows.length);
        set.rows.push({
          state,
          point,
          direction: push,
          lower: -given,
          velocity: relative(point, push),
          contact,
        });
      }
      centroid = Vector3.scale(centroid, 1 / pressed.length);
      for (const tangent of [t1, t2]) {
        entry.tangents.push(set.rows.length);
        set.rows.push({
          state,
          point: centroid,
          direction: tangent,
          velocity: relative(centroid, tangent),
          contact: head,
        });
      }
      set.patches.push(entry);
    }
    return set;
  }

  /**
   * Solve the rows as a complementarity problem by active set, every
   * condition inside the one linear system of each round:
   *
   * - a free row holds its velocity: `(K lambda + u)_r = 0`;
   * - a normal row below its bound is held at it, `lambda_r = lower_r`, and
   *   released again when, held, its point would approach (`(K lambda +
   *   u)_r < 0`), the Signorini complementarity;
   * - a patch whose total friction, the contact passes' `F` plus the rows'
   *   `lambda_t`, leaves its cone `mu (N + sum lambda_n)` slides along the
   *   direction `d` the total left in: `F + lambda_t = d mu (N + sum
   *   lambda_n)`, linear in the patch's normal impulses, so the normals are
   *   solved with the friction they really get (Coulomb's law, sliding
   *   branch, on the substep's whole friction).
   *
   * A round that changes no row's state is the answer. Every change either
   * holds or releases one normal or starts one patch sliding, so the rounds
   * are bounded by twice the rows; the last round's solution stands if the
   * bound is reached.
   */
  function activeSet(
    k: readonly number[][],
    u: readonly number[],
    set: ISet,
  ): number[] | null {
    const size: number = set.rows.length;
    const held: Map<number, number> = new Map();
    const sliding: Map<IPatch, ISlip> = new Map();
    let lambda: number[] | null = null;
    for (let round: number = 0; round <= 2 * size; ++round) {
      const matrix: number[][] = k.map((line: number[]): number[] => [...line]);
      const right: number[] = u.map((value: number): number => -value);
      for (const [r, value] of held) {
        matrix[r] = matrix[r]!.map((_: number, s: number): number =>
          s === r ? 1 : 0,
        );
        right[r] = value;
      }
      for (const [patch, slip] of sliding)
        patch.tangents.forEach((r: number, which: number): void => {
          const along: number = which === 0 ? slip.first : slip.second;
          const prior: number =
            which === 0 ? patch.prior.first : patch.prior.second;
          matrix[r] = matrix[r]!.map((_: number, s: number): number =>
            s === r
              ? 1
              : patch.normals.includes(s)
                ? -patch.friction * along
                : 0,
          );
          right[r] = patch.friction * patch.normal * along - prior;
        });
      lambda = prepareLinearSystem.solve(matrix, right);
      if (lambda === null) return null;
      const current: number[] = lambda;
      let changed: boolean = false;
      set.rows.forEach((row: IRow, r: number): void => {
        if (row.lower === undefined) return;
        if (!held.has(r) && current[r]! < row.lower) {
          held.set(r, row.lower);
          changed = true;
        } else if (held.has(r) && velocity(k, u, current, r) < 0) {
          held.delete(r);
          changed = true;
        }
      });
      for (const patch of set.patches) {
        if (sliding.has(patch)) continue;
        const t0: number = patch.prior.first + current[patch.tangents[0]!]!;
        const t1: number = patch.prior.second + current[patch.tangents[1]!]!;
        const magnitude: number = Math.hypot(t0, t1);
        if (magnitude > cone(patch, current)) {
          sliding.set(patch, {
            first: t0 / magnitude,
            second: t1 / magnitude,
          });
          changed = true;
        }
      }
      if (!changed) return current;
    }
    return lambda;
  }

  /**
   * A pair of values on a patch's two tangential rows: a sliding direction or a friction impulse.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both members.
   * @evidence contracts/development/design.md#principled-representation Two components on the rows' tangent directions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by collect and activeSet; read by solveXpbdSupportCascade through IPatch.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No unit is implied beyond the owner's.
   */
  export interface ISlip {
    /** Along the first tangential row. */
    first: number;

    /** Along the second tangential row. */
    second: number;
  }

  /** A row's velocity change along its direction under impulses `lambda`: `(K lambda + u)_r`. */
  function velocity(
    k: readonly number[][],
    u: readonly number[],
    lambda: readonly number[],
    r: number,
  ): number {
    let sum: number = u[r]!;
    for (let s: number = 0; s < lambda.length; ++s)
      sum += k[r]![s]! * lambda[s]!;
    return sum;
  }

  /** A patch's cone on its whole friction: mu times the contact passes' normal plus the rows' normal impulses, at least zero. */
  function cone(patch: IPatch, lambda: readonly number[]): number {
    const normal: number = patch.normals.reduce(
      (sum: number, r: number): number => sum + lambda[r]!,
      0,
    );
    return Math.max(0, patch.friction * (patch.normal + normal));
  }

  /** A row's velocity change under a response, along its direction. */
  function along(
    row: IRow,
    response: AutoMovieXpbdArticulation.IResponse,
  ): number {
    return Vector3.dot(
      row.direction,
      AutoMovieXpbdArticulation.pointChange(
        response.change[row.state]!,
        row.point,
      ),
    );
  }

  /** Two unit tangents completing a unit normal to a right-handed basis. */
  function tangents(n: IAutoMovieVector3): IAutoMovieVector3[] {
    const seed: IAutoMovieVector3 =
      Math.abs(n.x) < Math.SQRT1_2 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    const t1: IAutoMovieVector3 = Vector3.normalize(Vector3.cross(n, seed));
    return [t1, Vector3.cross(n, t1)];
  }

  /** The Tikhonov weight on K's diagonal: the square root of float64's machine epsilon. */
  const REGULARIZATION: number = Math.sqrt(Number.EPSILON);
}
