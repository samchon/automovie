import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { AutoMovieXpbdArticulation } from "../AutoMovieXpbdArticulation";
import type { AutoMovieXpbdBody } from "../AutoMovieXpbdBody";
import { AutoMovieXpbdJoint } from "../AutoMovieXpbdJoint";
import { AutoMovieXpbdSupportRows as Rows } from "../AutoMovieXpbdSupportRows";
import type { AutoMovieXpbdWorld } from "../AutoMovieXpbdWorld";
import { solveXpbdArticulationContacts as Contacts } from "./solveXpbdArticulationContacts";
import { solveXpbdSupportCascade } from "./solveXpbdSupportCascade";

/*
 * One articulated tree's support task (`solveXpbdArticulationContacts`): the
 * cascade over its support rows and actuated axes, and the actuated chain
 * between a body and the tree's root.
 */
export namespace solveXpbdArticulationTask {
  /*
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
   * Returns: The response with the impulses to record, or null when the cascade
   * has no feasible point.
   */
  export function solveTask(
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
    const free: AutoMovieXpbdArticulation.IResponse = Contacts.combine(
      base,
      responses.slice(set.rows.length),
      drive.map((value: number): number => -value),
      { rows: [], patches: [] },
    ).response;
    const k: number[][] = set.rows.map((row: IRow): number[] =>
      responses.map((response: AutoMovieXpbdArticulation.IResponse): number =>
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
      ...levers.map((lever: IAutoMovieVector3): number =>
        Vector3.length(lever),
      ),
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
    // With IHMC's objective, the rows are its tasks instead (`objective`):
    // the force, the yaw moment about the centre of mass when selected, and
    // the moment about the desired centre of pressure over its body's rows.
    const objective: AutoMovieXpbdWorld.IObjective | undefined = task.objective;
    const width: number = objective
      ? 3 + (objective.yaw ? 1 : 0) + (objective.pressure ? 2 : 0)
      : 6;
    const columns: number[][] = responses.map(
      (_: AutoMovieXpbdArticulation.IResponse, s: number): number[] =>
        s >= set.rows.length
          ? new Array<number>(width).fill(0)
          : objective
            ? Contacts.objectiveRow(
                set.rows[s]!,
                Vector3.add(set.rows[s]!.point, tree.origin),
                tree.states[set.rows[s]!.state]!.body,
                objective,
              )
            : wrench(set.rows[s]!, levers[s]!),
    );
    // The contact passes already gave each pressed point its normal impulse
    // and each patch its friction; the task asks the total.
    let prior: number[] = new Array<number>(width).fill(0);
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
    // IHMC's tasks ask the force, a yaw moment of zero and a moment of zero
    // about the desired centre of pressure, each weighted by its command.
    const target: number[] = (
      objective
        ? [
            task.force.x * h,
            task.force.y * h,
            task.force.z * h,
            ...(objective.yaw ? [0] : []),
            ...(objective.pressure ? [0, 0] : []),
          ]
        : [
            task.force.x * h,
            task.force.y * h,
            task.force.z * h,
            (task.torque.x * h) / length,
            (task.torque.y * h) / length,
            (task.torque.z * h) / length,
          ]
    ).map((value: number, m: number): number => value - prior[m]!);
    const weights: number[] | undefined = objective
      ? [
          objective.force.x,
          objective.force.y,
          objective.force.z,
          ...(objective.yaw ? [objective.yaw.weight] : []),
          ...(objective.pressure
            ? [objective.pressure.weight, objective.pressure.weight]
            : []),
        ]
      : undefined;
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
          impulse: Contacts.room({
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
            (
              name: "x" | "y" | "z",
              m: number,
            ): solveXpbdSupportCascade.IMotion => ({
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
    const x: number[] | null = solveXpbdSupportCascade.run({
      k,
      u,
      columns,
      target,
      ...(weights ? { weights } : {}),
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
    return Contacts.combine(free, responses, x, set);
  }

  /*
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
        (
          edge: AutoMovieXpbdArticulation.IEdge,
          index: number,
        ): [number, number] => [edge.child, index],
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
          (
            axis: AutoMovieXpbdArticulation.IAxis,
            index: number,
          ): IActuator[] =>
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
}

/*
 * A support row.
 */
type IRow = Contacts.IRow;

/*
 * A support patch.
 */
type IPatch = Contacts.IPatch;

/*
 * A tree's support rows and patches.
 */
type ISet = Contacts.ISet;

/*
 * An actuated axis.
 */
type IActuator = Contacts.IActuator;

/*
 * A held solution.
 */
type IHeld = Contacts.IHeld;
