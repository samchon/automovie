import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import { jump } from "../actions/jump";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A salto: a jump whose flight turns the whole body head over heels about
 * its centre of mass, forward or backward, a whole number of times, and
 * lands on the feet (#3377: the salti of floor gymnastics, a diver's and a
 * free-runner's flip).
 *
 * The jump is `jump`'s own plan: its push-off, its ballistic centre of mass
 * and its landing are kept as they are. Between `takeoff` and `touchdown`
 * the body it shows is turned rigidly about the centre of mass, on the axis
 * across the jump's heading, by an angle that grows at a constant rate from
 * 0 to the whole turns: the mean angular velocity is the turns over the
 * flight time, as a body in flight keeps its angular momentum, and a rigid
 * body its rate. A rigid turn about the centre of mass leaves that point on
 * its parabola, so the flight stays ballistic.
 *
 * The rate a person can turn at bounds the turns: `RATE` turns a second
 * (provisional, the order of a tucked salto's rate in Yeadon's simulations
 * of aerial movement, J. Biomech. 26, 1993). A flight too short for the
 * turns asked is refused, with the apex that would do.
 *
 * Events: the jump's (`takeoff`, `apex`, `touchdown`, `settled`).
 *
 * First pass: the body does not tuck, so the rate is a layout's kept
 * constant; the push-off does not show the lean and the arm throw that
 * give the angular momentum; a twist, and a turn about another axis (a
 * cartwheel, a side salto), are not planned.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is taken from the jump, the rotation's law and why the flight stays ballistic, the bound with its source, the events and the first pass limits.
 * @evidence contracts/development/design.md#principled-representation A law record over the jump's plan: one rigid turn of each shown posture, so the jump's physics is inherited and not restated.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the bound, the default apex, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The apex's default is a share of the stature; the rate is derived from the flight time, not stated.
 */
export namespace salto {
  /** The action's name. */
  export const name: HumanActionKey = "salto";

  /** Cancel table: the jump's. */
  export const interrupts: IHumanActionLaw["interrupts"] = jump.interrupts;

  /** The greatest mean rate of turn, turns a second (provisional; Yeadon 1993). */
  export const RATE: number = 2.5;

  /** The flight's apex above take-off when the author names none, a share of the stature (provisional). */
  export const APEX: number = 0.3;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The landing place, the apex, the way and the turns.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The way is a closed union and the turns are whole.
   */
  export interface IParams {
    /** The floor point to land on, world metres. */
    to: IAutoMovieVector3;

    /** Apex height of the flight above take-off, metres; `APEX` of the stature when absent. */
    apex?: number;

    /** Which way the body turns; `forward` when absent. */
    way?: "forward" | "backward";

    /** Whole turns; 1 when absent. */
    turns?: number;
  }

  /**
   * Plan a salto.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the jump is refused, the turns are not a positive whole number, or the flight is too short for them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The jump's posture at a second, turned about its own centre of mass by the angle reached at that second: the root and every world goal of a limb go round that point and the pitch takes the angle, which is one rigid motion of the shown body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The jump's plan, the flight's two instants, the bound, the turned posture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rate past the bound refuses with the apex that affords the turns; the turn is whole, so the landing posture is the jump's own.
   * @evidence contracts/development/implementation.md#efficient-algorithms One centre of mass per evaluated airborne second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the jump's plan and the engine's mass model, built once per plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the jump's plan and the mass model.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body: IHumanBody = context.body;
    const turns: number = p.turns ?? 1;
    HumanBound.whole("turns", turns);
    const inner: IHumanActionPlan = jump.plan({
      ...context,
      params: { to: p.to, apex: p.apex ?? APEX * body.measure.stature },
    });
    const at = (event: string): number =>
      inner.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === event,
      )!.share *
      inner.duration;
    const off: number = at("takeoff");
    const flight: number = at("touchdown") - off;
    if (turns / flight > RATE) {
      const needed: number = turns / RATE;
      throw new HumanRefusal({
        kind: "parameter",
        axis: "turns",
        value: turns,
        feasible: {
          kind: "range",
          minimum: 1,
          maximum: Math.max(1, Math.floor(RATE * flight)),
          unit: "",
        },
        reason: `${turns} turn(s) in a flight of ${flight.toFixed(2)} s is ${(turns / flight).toFixed(2)} turns a second, beyond ${RATE}`,
        fix: `give an apex of at least ${((9.81 * needed * needed) / 8).toFixed(2)} m, or fewer turns`,
      });
    }
    const total: number = (p.way === "backward" ? -1 : 1) * 360 * turns;
    const model: ReturnType<typeof resolveAutoMovieCenterOfMass> =
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const posture = (seconds: number): IHumanPosture => {
      const base: IHumanPosture = inner.posture(seconds);
      const share: number = (seconds - off) / flight;
      if (share <= 0 || share >= 1) return base;
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(body, resolveHumanPosture(body, base));
      const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
        model,
        bones,
      );
      const angle: number = total * share;
      const turn: IAutoMovieQuaternion = Quaternion.multiply(
        resolveHumanPosture.heading({ yaw: base.yaw, pitch: angle, roll: 0 }),
        Quaternion.inverse(
          resolveHumanPosture.heading({ yaw: base.yaw, pitch: 0, roll: 0 }),
        ),
      );
      const round = (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(
          centre,
          Quaternion.rotateVector(turn, Vector3.subtract(point, centre)),
        );
      const limbs: IHumanPosture["limbs"] = {};
      for (const [limb, goal] of Object.entries(base.limbs) as [
        keyof IHumanPosture["limbs"],
        IHumanPosture.IGoal,
      ][])
        limbs[limb] =
          goal.on !== undefined
            ? goal
            : {
                ...goal,
                point: round(goal.point),
                bend: round(goal.bend),
                ...(goal.rotation === undefined
                  ? {}
                  : { rotation: Quaternion.multiply(turn, goal.rotation) }),
              };
      return {
        ...base,
        root: round(base.root),
        pitch: base.pitch + angle,
        limbs,
      };
    };
    return { ...inner, posture };
  }
}
