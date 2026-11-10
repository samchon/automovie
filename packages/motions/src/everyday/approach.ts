import type {
  AutoMovieMotionTarget,
  IAutoMovieBodyMeasure,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import { walk } from "../actions/walk";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanEffort } from "./HumanEffort";
import { HumanProxemics } from "./HumanProxemics";
import { HumanTrunk } from "./HumanTrunk";

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
 * prop's point or a free point. For `handing` the gap comes from both
 * people's own measures, so a short and a tall partner meet at a gap both
 * can reach; a prop or point target uses the performer's measure alone. A
 * target already nearer than the
 * requested gap is refused with both distances, since an approach never
 * backs away.
 *
 * A `side` stops on a named side of a person target instead, in that
 * person's own frame (their sternum's outward normal is their front), at the
 * same gap, and the walk's final heading turns the body to face them on the
 * last steps. People named in `avoid` are walked round: where the straight
 * leg would pass one nearer than the walker's lateral clearance (0.5 m,
 * provisional; walkers keep an elliptical personal space wider ahead than to
 * the side while circumventing a person, Gerin-Lajoie, Richards and McFadyen
 * 2005, Motor Control 9:242) plus half the walker's chest breadth, a
 * waypoint abeam that person takes the walk round on the side that deviates
 * least. Walkers moving past each other are not avoided here; reciprocal
 * avoidance belongs to the engine. An Effort sets the walk's step length,
 * arm swing and elbow width ({@link HumanEffort}); bound flow's elbows held
 * in cannot be shown, since the walk only widens them.
 *
 * Events are the walk's (each foot's toe-offs and heel strikes,
 * `lastFootfall`, `arrive`).
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

    /**
     * Where around a person target to stop, in that person's own frame:
     * `front`, `left`, `right` or `behind`; along the line from the start
     * when absent (and always for a prop or point).
     */
    side?: "front" | "left" | "right" | "behind";

    /** The pace; `normal` when absent. */
    pace?: walk.IParams["pace"];

    /** Movement quality: steps, arm swing and elbow width of the walk. */
    effort?: HumanEffort.IEffort;

    /** People to walk round on the way, by subject id. */
    avoid?: string[];
  }

  /** Lateral clearance a walker keeps from a person it passes, metres (provisional; Gerin-Lajoie, Richards and McFadyen 2005). */
  export const CLEARANCE: number = 0.5;

  /**
   * Plan an approach.
   *
   * @param context The action's context.
   * @returns The walk's plan to the stop point.
   * @throws {Error} When the target is already nearer than the gap, or a side is asked of a target that is not a person.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const p: IParams = context.params;
    const target: AutoMovieMotionTarget = p.target;
    const aimed = context.aim(target, context.start);
    const point: IAutoMovieVector3 = aimed.point;
    const other: IAutoMovieBodyMeasure =
      target.kind === "person"
        ? context.performer(target.subject).body.measure
        : body.measure;
    const gap: number = HumanProxemics.gap(
      p.at ?? "personal",
      body.measure,
      other,
    );
    const feet: IAutoMovieVector3 = {
      x:
        (context.entry.feet.left.ankle.x + context.entry.feet.right.ankle.x) /
        2,
      y: 0,
      z:
        (context.entry.feet.left.ankle.z + context.entry.feet.right.ankle.z) /
        2,
    };
    const lead: number = approach.chest(body);

    // The stop: along the line from the start, or on a named side of a person.
    let stop: { at: IAutoMovieVector3; yaw: number };
    if (p.side === undefined) {
      const now: number = Math.hypot(point.x - feet.x, point.z - feet.z) - lead;
      if (now < gap - 1e-9)
        throw new Error(
          `${context.subject}: the target is ${now.toFixed(3)} m from the chest, nearer than the requested gap ${gap.toFixed(3)} m`,
        );
      stop = HumanProxemics.stop(feet, point, gap, lead);
    } else {
      if (target.kind !== "person")
        throw new Error(
          `${context.subject}: a side is a person's side; this target is a ${target.kind}`,
        );
      const facing: number =
        (Math.atan2(aimed.normal.x, aimed.normal.z) * 180) / Math.PI;
      const turn: number = { front: 0, left: 90, right: -90, behind: 180 }[
        p.side
      ];
      const out: IAutoMovieVector3 = HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: facing + turn },
        { x: 0, y: 0, z: 1 },
      );
      const at: IAutoMovieVector3 = {
        x: point.x + out.x * (gap + lead),
        y: 0,
        z: point.z + out.z * (gap + lead),
      };
      stop = {
        at,
        yaw: (Math.atan2(point.x - at.x, point.z - at.z) * 180) / Math.PI,
      };
    }

    // Walk round people in the way: a waypoint abeam each one the straight
    // leg would pass nearer than the clearance plus their half breadth, on
    // the side that deviates least.
    const via: IAutoMovieVector3[] = [];
    for (const subject of p.avoid ?? []) {
      const at: IAutoMovieVector3 = context.aim(
        { kind: "person", subject, region: "sternum" },
        context.start,
      ).point;
      const from: IAutoMovieVector3 = via.at(-1) ?? feet;
      const pass: number = CLEARANCE + body.measure.chestBreadth / 2;
      const waypoint: IAutoMovieVector3 | undefined = approach.abeam(
        from,
        stop.at,
        at,
        pass,
      );
      if (waypoint !== undefined) via.push(waypoint);
    }

    const mods: HumanEffort.IModifiers = HumanEffort.modifiers(p.effort);
    const walkTo = (at: IAutoMovieVector3): IHumanActionPlan =>
      walk.plan({
        ...context,
        params: {
          to: at,
          face: (Math.atan2(point.x - at.x, point.z - at.z) * 180) / Math.PI,
          ...(via.length === 0 ? {} : { via }),
          ...(p.pace === undefined ? {} : { pace: p.pace }),
          ...(p.effort === undefined
            ? {}
            : {
                stride: Math.min(1.3, Math.max(0.6, mods.step)),
                armSwing: Math.min(2, Math.max(0, mods.swing)),
                elbows: Math.min(30, Math.max(0, 100 * mods.elbow)),
              }),
        },
      });

    // The gap is a goal on the arriving chest: plan, read where the sternum
    // actually arrives, and move the stop along the line to the target by the
    // gap's error once (the walk's arrival posture, with its lean and its
    // closing step, places the chest a few centimetres off the standing
    // estimate).
    const first: IHumanActionPlan = walkTo(stop.at);
    const arrived: IAutoMovieVector3 = HumanTrunk.region(
      body,
      first.posture(first.duration),
      "sternum",
    ).point;
    const error: number =
      Math.hypot(point.x - arrived.x, point.z - arrived.z) - gap;
    if (Math.abs(error) <= 0.002) return first;
    const length: number = Math.hypot(point.x - stop.at.x, point.z - stop.at.z);
    return walkTo({
      x: stop.at.x + ((point.x - stop.at.x) / length) * error,
      y: 0,
      z: stop.at.z + ((point.z - stop.at.z) / length) * error,
    });
  }

  /**
   * A waypoint that takes a straight leg round a point it would pass too
   * near: abeam the point at the passing distance, on the side of the leg the
   * point already lies away from, or none when the leg passes clear or the
   * point lies beyond either end.
   *
   * @param from The leg's start, floor metres.
   * @param to The leg's end.
   * @param point The point to pass.
   * @param pass The least passing distance, metres.
   * @returns The waypoint on the floor, or undefined.
   */
  export function abeam(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    point: IAutoMovieVector3,
    pass: number,
  ): IAutoMovieVector3 | undefined {
    const dx: number = to.x - from.x;
    const dz: number = to.z - from.z;
    const length: number = Math.hypot(dx, dz);
    if (length < 1e-9) return undefined;
    const ux: number = dx / length;
    const uz: number = dz / length;
    const along: number = (point.x - from.x) * ux + (point.z - from.z) * uz;
    if (along <= 0 || along >= length) return undefined;
    const across: number = (point.x - from.x) * -uz + (point.z - from.z) * ux;
    if (Math.abs(across) >= pass) return undefined;
    const side: number = across >= 0 ? -1 : 1;
    return {
      x: point.x + side * pass * -uz,
      y: 0,
      z: point.z + side * pass * ux,
    };
  }

  /**
   * How far the front of the chest stands ahead of the ankles' midpoint in
   * the standing posture, metres: the sternum region's forward offset with
   * the body's upright alignment and lean.
   *
   * @param body The body.
   * @returns Metres.
   */
  export function chest(body: IHumanBody): number {
    const posture: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
    const sternum: IAutoMovieVector3 = HumanTrunk.region(
      body,
      posture,
      "sternum",
    ).point;
    const ankles: number =
      (posture.limbs.leftLeg!.point.z + posture.limbs.rightLeg!.point.z) / 2;
    return sternum.z - ankles;
  }
}
