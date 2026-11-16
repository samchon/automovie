import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";

/**
 * An action planned at the time its motion needs: a plan whose planned
 * motion moves a hand faster than the speed bound is replanned slower, by
 * the factor its refusal names, the span it needs over the span it had.
 *
 * Scaling time by a factor keeps a path and divides every speed on it by
 * the factor (Hollerbach 1984, "Dynamic scaling of manipulator
 * trajectories", J Dyn Syst Meas Control 106:102), so where the slower
 * action leaves its path as it was, one replan meets the bound. Where the
 * slower base the action is written on moves the path, the action is
 * replanned again only while the factor still needed falls, and refused
 * with both factors once it does not. The slower time reaches the plan
 * through the action's time scale (`IHumanActionContext.tempo`), which the
 * manner owner applies to every span physics does not fix
 * (`AutoMovieMotionManner.of`).
 */
export namespace HumanPerformanceTempo {
  /**
   * An action's plan at the time its motion needs.
   *
   * @param law The action's law.
   * @param context The action's context; its time scale is raised while the action is replanned.
   * @returns The plan.
   * @throws {HumanRefusal} Whatever the law refuses with on any other ground, and a `duration` refusal naming both factors when a replan needs no less time than the one before.
   */
  export function plan<P>(
    law: Pick<IHumanActionLaw<P>, "plan">,
    context: IHumanActionContext<P>,
  ): IHumanActionPlan {
    let needed: number | undefined;
    for (;;) {
      try {
        return law.plan(context);
      } catch (error: unknown) {
        const factor: number | undefined = slower(error);
        if (factor === undefined) throw error;
        if (needed !== undefined && !(factor < needed))
          throw new HumanRefusal({
            kind: "reach",
            axis: "duration",
            value: factor,
            feasible: null,
            reason: `replanned at ${needed.toFixed(3)} times its time, the action still needs ${factor.toFixed(3)} times that for its hands to move within the speed bound`,
            fix: "give the action more time",
          });
        needed = factor;
        context.tempo = (context.tempo ?? 1) * factor;
      }
    }
  }

  /**
   * The factor a refusal asks the action's time to grow by: a `duration`
   * refusal of a reach whose feasible range is the span its motion needs,
   * over the span it had; none for any other refusal.
   *
   * @param error What the plan threw.
   * @returns The factor, greater than 1; undefined when the refusal asks no more time.
   */
  export function slower(error: unknown): number | undefined {
    if (
      !(error instanceof HumanRefusal) ||
      error.kind !== "reach" ||
      error.axis !== "duration" ||
      error.feasible === null ||
      error.feasible.kind !== "range" ||
      error.feasible.unit !== "s" ||
      error.feasible.minimum === null ||
      typeof error.value !== "number" ||
      !(error.value > 0)
    )
      return undefined;
    const factor: number = error.feasible.minimum / error.value;
    return factor > 1 ? factor : undefined;
  }
}
