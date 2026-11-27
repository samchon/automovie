import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSalto,
} from "@automovie/interface";

import { jump } from "../../actions/internal/jump";
import { HumanBound } from "../../law/internal/HumanBound";

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
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSalto.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanSalto.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const turns: number = HumanBound.whole("turns", p.turns ?? 1);

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
