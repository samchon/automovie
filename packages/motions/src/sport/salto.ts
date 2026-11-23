import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSalto,
} from "@automovie/interface";

import { jump } from "../actions/jump";
import { HumanBound } from "../law/HumanBound";

/**
 * A salto: a jump whose flight turns the whole body head over heels about its
 * centre of mass, forward or backward, a whole number of times, and lands on
 * the feet (the salti of floor gymnastics, a diver's and a free-runner's
 * flip).
 *
 * A row of `jump`: the jump asked for `turns` somersaults its way, so the
 * performance's flight pass (`HumanPerformanceFlight`) turns the composed body
 * by the angular momentum that lands them, a tuck laid over the flight turning
 * it faster. A request the take-off cannot meet is the pass's refusal.
 *
 * Events: the jump's (`takeoff`, `apex`, `touchdown`, `settled`).
 *
 * The take-off's largest momentum is the flight pass's physical ceiling, and
 * the search must meet its turns within that ceiling. `RATE`, the provisional
 * rate other gymnastics laws still read, is not read here.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the row asks of the jump, who turns it and refuses, the events and the first pass's gap.
 * @evidence contracts/development/design.md#principled-representation A law record whose plan is the jump's with fixed turns.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the bound other laws read, the default apex, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The turning is the flight pass's; the apex's default is a share of the stature.
 */
export namespace salto {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "salto";

  /** Cancel table: the jump's. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    jump.interrupts;

  /** The greatest mean rate of turn, turns a second (provisional; Yeadon 1993). */
  export const RATE: number = 2.5;

  /**
   * The flight's apex above take-off when the author names none, a share of the
   * stature (provisional).
   */
  export const APEX: number = 0.3;

  /**
   * Plan a salto.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the jump is refused or the turns are not a
   *   positive whole number.
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The jump's plan with whole somersaults requested, so its flight turns by conserved angular momentum over the composed shape.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One check of the turns and one jump.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The turns are whole, so the landing is the jump's own; no rate is assumed.
   * @evidence contracts/development/implementation.md#efficient-algorithms The jump's own cost; the flight pass's is stated there.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the jump's plan whole.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the jump's plan.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSalto.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanSalto.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const turns: number = p.turns ?? 1;
    HumanBound.whole("turns", turns);

    // A salto is a jump asked for whole somersaults: the flight
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
