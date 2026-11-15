import type { IAutoMovieVector3 } from "@automovie/interface";
import type { tags } from "typia";

import type { HumanActionKey } from "../HumanActionKey";
import { jump } from "../actions/jump";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanBound } from "../law/HumanBound";
import type { HumanUnit } from "../law/HumanUnit";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";

/**
 * A salto: a jump whose flight turns the whole body head over heels about
 * its centre of mass, forward or backward, a whole number of times, and
 * lands on the feet (#3377: the salti of floor gymnastics, a diver's and a
 * free-runner's flip).
 *
 * A row of `jump` (#3428): the jump asked for `turns` somersaults its way,
 * so the performance's flight pass (`HumanPerformanceFlight`) turns the
 * composed body by the angular momentum that lands them, a tuck laid over
 * the flight turning it faster. A request the take-off cannot meet is the
 * pass's refusal.
 *
 * Events: the jump's (`takeoff`, `apex`, `touchdown`, `settled`).
 *
 * First pass: the take-off's largest momentum is not bounded yet, so the
 * pass refuses only a request its search cannot land; `RATE`, the rate
 * other gymnastics laws are still bounded by, is not read here.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the row asks of the jump, who turns it and refuses, the events and the first pass's gap.
 * @evidence contracts/development/design.md#principled-representation A law record whose plan is the jump's with fixed turns.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the bound other laws read, the default apex, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The turning is the flight pass's; the apex's default is a share of the stature.
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
    turns?: number & tags.Type<"uint32"> & tags.Minimum<1> & HumanUnit<"">;
  }

  /**
   * Plan a salto.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the jump is refused or the turns are not a positive whole number.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The jump's plan with whole somersaults requested, so its flight turns by conserved angular momentum over the composed shape.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One check of the turns and one jump.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The turns are whole, so the landing is the jump's own; no rate is assumed.
   * @evidence contracts/development/implementation.md#efficient-algorithms The jump's own cost; the flight pass's is stated there.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the jump's plan whole.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the jump's plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body: IHumanBody = context.body;
    const turns: number = p.turns ?? 1;
    HumanBound.whole("turns", turns);

    // A salto is a jump asked for whole somersaults (#3428): the flight
    // pass turns it by the momentum its composed shape needs, and a request
    // the take-off cannot meet is the pass's refusal.
    return jump.plan({
      ...context,
      params: {
        to: p.to,
        apex: p.apex ?? APEX * body.measure.stature,
        rotation: { somersault: turns, way: p.way ?? "forward" },
      },
    });
  }
}
