import type { AutoMovieMotionTarget, IAutoMovieBodyMeasure, IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { walk } from "../actions/walk";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanProxemics } from "./HumanProxemics";

/**
 * Walking up to a person, a prop or a point and stopping at an
 * interpersonal distance, facing it.
 *
 * The goal is the stop, not the steps: the front of the performer's chest
 * (the sternum region) must end `gap` short of the target, horizontally,
 * along the line from where the performer stands to the target
 * ({@link HumanProxemics}). The law turns that goal into the floor point the
 * feet's midpoint must reach, `gap` plus the chest's lead over the feet back
 * from the target, and lets the walk law place whole steps to it, so the stop
 * is exact without sliding (the walk's footprints are inverse-kinematics
 * goals) and the body faces the target because it walked straight at it.
 *
 * The target is read once, at the start: a person's region (the `sternum`
 * for Hall's chest-to-chest gaps, `upperBack` to stop behind someone), a
 * prop's point or a free point. For `handing` the partner's arm is
 * estimated from their stature, read as the height of their crown, scaling
 * the performer's own measure by the stature ratio, so a short and a tall
 * partner meet at a gap both can reach. A target already nearer than the
 * requested gap is refused with both distances, since an approach never
 * backs away.
 *
 * Events are the walk's (each foot's toe-offs and heel strikes,
 * `lastFootfall`, `arrive`). Stopping beside or behind a target, which needs
 * the last step to turn the body, waits on the walk law's final-heading
 * option.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the method, the timing, the events and the refusals, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan the performance dispatches through, plus the helpers its tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, hand and frame types; no body is special-cased.
 * @evidence contracts/development/implementation.md#principled-implementation Effector goals (sockets, footprints, the gaze line) solved by the shared inverse kinematics, with balance and timing from the cited laws.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plans once, then evaluates each posture in closed form.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Infeasible requests are refused with the feasible range instead of clamped; provisional constants are named and marked.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond a few forward-kinematics passes and limb fits.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan is computed once per instance and every posture reads it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan's closures hold only the instance's own inputs and are released with the performance.
 */
export namespace approach {
  /** The action's name. */
  export const name: HumanActionName = "approach";

  /** Cancel table: an approach is a walk and is cut as one. */
  export const interrupts: IHumanActionLaw["interrupts"] = walk.interrupts;

  /** Parameters. */
  export interface IParams {
    /** What to approach. */
    target: AutoMovieMotionTarget;

    /** The gap: a named band or metres; `personal` when absent. */
    at?: HumanProxemics.Band | number;

    /** The pace; `normal` when absent. */
    pace?: walk.IParams["pace"];
  }

  /**
   * Plan an approach.
   *
   * @param context The action's context.
   * @returns The walk's plan to the stop point.
   * @throws {Error} When the target is already nearer than the gap.
   */
  export function plan(context: IHumanActionContext<IParams>): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const target: AutoMovieMotionTarget = context.params.target;
    const point: IAutoMovieVector3 = context.aim(target, context.start).point;
    const other: IAutoMovieBodyMeasure =
      target.kind === "person"
        ? HumanProxemics.scaled(body.measure, context.aim({ ...target, region: "crown" }, context.start).point.y / body.measure.stature)
        : body.measure;
    const gap: number = HumanProxemics.gap(context.params.at ?? "personal", body.measure, other);
    const feet: IAutoMovieVector3 = {
      x: (context.entry.feet.left.ankle.x + context.entry.feet.right.ankle.x) / 2,
      y: 0,
      z: (context.entry.feet.left.ankle.z + context.entry.feet.right.ankle.z) / 2,
    };
    const stop = HumanProxemics.stop(feet, point, gap, approach.chest(body));
    const now: number = Math.hypot(point.x - feet.x, point.z - feet.z) - approach.chest(body);
    if (now < gap - 1e-9) throw new Error(`${context.subject}: the target is ${now.toFixed(3)} m from the chest, nearer than the requested gap ${gap.toFixed(3)} m`);
    return walk.plan({ ...context, params: { to: stop.at, ...(context.params.pace === undefined ? {} : { pace: context.params.pace }) } });
  }

  /**
   * How far the front of the chest stands ahead of the ankles' midpoint at
   * rest, metres: the sternum region's forward offset.
   *
   * @param body The body.
   * @returns Metres.
   */
  export function chest(body: IHumanBody): number {
    const frame = body.surfaces.regions.sternum;
    const joint: IAutoMovieVector3 = body.rest.get(frame.bone)!;
    const ankles: number = (body.rest.get("leftFoot")!.z + body.rest.get("rightFoot")!.z) / 2;
    return joint.z + frame.point.z - ankles;
  }
}
