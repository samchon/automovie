import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanRefusal } from "../law/HumanRefusal";

/**
 * An action planned at the time its motion needs: a plan whose planned
 * motion moves a hand faster than the speed bound is replanned slower, by
 * the factor its refusal names, the span it needs over the span it had.
 *
 * Scaling time by a factor keeps a path and divides every speed on it by
 * the factor (Hollerbach 1984, "Dynamic scaling of manipulator
 * trajectories", J Dyn Syst Meas Control 106:102), so where the slower
 * action leaves its path as it was, one replan meets the bound. A plan
 * stops at the first arm group that refuses, so a replan that meets one
 * group's need may reveal another's, which is stepped to in turn. Where the
 * slower base the action is written on moves a path, the same group is
 * replanned again only while the factor it needs falls by more than its
 * roundoff, and the action is refused with the whole time it needs once it
 * does not, so the replans end after a number bounded by each group's first
 * factor. The slower time reaches the plan
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
   * @throws {HumanRefusal} Whatever the law refuses with on any other ground, and a `duration` refusal whose value is the whole time the action needs over the time it was first planned at, when the same refusing group (or the same refusal outside any group) needs no less after a replan than before it.
   */
  export function plan<P>(
    law: Pick<IAutoMovieMotionHumanActionLaw<P>, "plan"> & HumanPhysics.ILaw,
    context: IAutoMovieMotionHumanActionContext<P>,
  ): IAutoMovieMotionHumanActionPlan {
    // The factor each refusing source last named: an arm group of the plan
    // by its handover key, any other refusal under no key.
    const needed: Map<string | undefined, number> = new Map();
    const first: number = context.tempo ?? 1;
    for (;;) {
      const refusal: AutoMovieMotionHumanArmPlanned.IRefusal = {};
      try {
        // The plan's arm groups read the last plan's solutions and write
        // their own (`AutoMovieMotionHumanArmPlanned.within`), so a replan at
        // the slower time starts where this one ended.
        return AutoMovieMotionHumanArmPlanned.within(
          context.handover,
          (): IAutoMovieMotionHumanActionPlan => {
            const planned: IAutoMovieMotionHumanActionPlan = law.plan(context);
            HumanPhysics.admitted(context.params, law, planned);
            return planned;
          },
          refusal,
        );
      } catch (error: unknown) {
        const factor: number | undefined = slower(error);
        if (factor === undefined) throw error;
        const tempo: number = context.tempo ?? 1;

        // The plan stops at the first group that refuses, so a replan that
        // meets that group's need can reveal another group's: that is a new
        // need, stepped to like the first. Only the same source naming a
        // factor that no longer falls by more than the roundoff of the ratio
        // it is read as is no progress, so the replans stop: each source's
        // factor shrinks by at least that share on every replan it refuses,
        // so at most ln(f0) / -ln(1 - ROUNDOFF) of them run per source from
        // its first factor f0, and a plan has finitely many sources.
        const source: string | undefined =
          refusal.error === error ? refusal.group : undefined;
        const before: number | undefined = needed.get(source);
        if (before !== undefined && !(factor < before * (1 - ROUNDOFF))) {
          // The time the action needs over the time it was first planned
          // at: what the author is told to give it.
          const total: number = (tempo / first) * factor;
          throw new HumanRefusal({
            kind: "reach",
            axis: "duration",
            value: total,
            feasible: null,
            reason: `the action needs at least ${total.toFixed(3)} times its time for its hands to move within the speed bound, and replanning it slower does not bring that need down: replanned at ${(tempo / first).toFixed(3)} times its time, it still needs ${factor.toFixed(3)} times that`,
            fix: "give the action more time",
          });
        }
        needed.set(source, factor);
        context.tempo = tempo * factor;
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

/**
 * The relative roundoff of a factor read as the quotient of two spans:
 * each span carries half an ulp, and the quotient one more, so three
 * machine epsilons bound it with one to spare.
 */
const ROUNDOFF: number = 4 * Number.EPSILON;
