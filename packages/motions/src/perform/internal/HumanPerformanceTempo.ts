import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmPlanned } from "../../compose/internal/AutoMovieMotionHumanArmPlanned";
import { HumanPhysics } from "../../law/internal/HumanPhysics";
import { HumanRefusal } from "../../law/HumanRefusal";

/*
 * An action planned at the time its motion needs: a plan whose planned motion
 * moves a hand faster than the speed bound is replanned slower, by the factor
 * its refusal names, the span it needs over the span it had.
 *
 * Scaling time by a factor keeps a path and divides every speed on it by the
 * factor (Hollerbach 1984, "Dynamic scaling of manipulator trajectories", J Dyn
 * Syst Meas Control 106:102), so where the slower action leaves its path as it
 * was, one replan meets the bound. A plan stops at the first arm group that
 * refuses, so a replan that meets one group's need may reveal another's, which
 * is stepped to once in turn. Where the slower base the action is written on
 * moves a path once (its held spans keep their seconds while its moving spans
 * slow), the same group names the rest of its need on that replan, and the
 * second replan takes the secant through its two refusals, exact where the span
 * grows affinely with the time scale; a group still refusing after `REPLANS`
 * replans has the action refused with the whole time it needs, never an
 * iteration toward the bound. The slower time reaches the plan through the
 * action's time scale (`IHumanActionContext.tempo`), which the manner owner
 * applies to every span physics does not fix (`AutoMovieMotionManner`).
 */
export namespace HumanPerformanceTempo {
  /*
   * An action's plan at the time its motion needs.
   * Parameter law: The action's law.
   * Parameter context: The action's context; its time scale is raised while the
   * action is replanned.
   * Returns: The plan.
   * Whatever the law refuses with on any other ground,
   * and a `duration` refusal whose value is the whole time the action needs
   * over the time it was first planned at, when the same refusing group (or
   * the same refusal outside any group) still refuses after its `REPLANS`
   * replans.
   */
  export function plan<P extends HumanPhysics.IBalanced>(
    law: Pick<IAutoMovieMotionHumanActionLaw<P>, "plan"> & HumanPhysics.ILaw,
    context: IAutoMovieMotionHumanActionContext<P>,
  ): IAutoMovieMotionHumanActionPlan {
    return paced(context, (at: IAutoMovieMotionHumanActionContext<P>) => {
      const planned: IAutoMovieMotionHumanActionPlan = law.plan(at);
      HumanPhysics.admitted(at.params, law, planned);
      return planned;
    });
  }

  /*
   * Prepare a phrase at the time its motion needs, before its events can be
   * placed. A standalone phrase supplies its own handover for these trials.
   * Parameter initial: The context for the first trial.
   * Parameter prepare: The phrase's preparation at a trial's time scale.
   * Returns: The prepared phrase.
   * At an infeasible scale after the allotted trials,
   * or immediately when the refusal is unrelated to duration.
   */
  export function paced<P>(
    initial: IAutoMovieMotionHumanActionContext<P>,
    prepare: (
      context: IAutoMovieMotionHumanActionContext<P>,
    ) => IAutoMovieMotionHumanActionPlan,
  ): IAutoMovieMotionHumanActionPlan {
    const context: IAutoMovieMotionHumanActionContext<P> =
      initial.handover === undefined ? standalone(initial) : initial;
    // How many replans each refusing source has had: an arm group of the
    // plan by its handover key, any other refusal under no key.
    const needed: Map<string | undefined, number> = new Map();
    // Each refusing source's last refusal: the time scale it was planned at
    // and the span it had there.
    const sampled: Map<string | undefined, ISample> = new Map();
    const first: number = context.tempo ?? 1;
    for (;;) {
      const refusal: AutoMovieMotionHumanArmPlanned.IRefusal = {};
      try {
        // The plan's arm groups read the last plan's solutions and write
        // their own (`AutoMovieMotionHumanArmPlanned.within`), so a replan at
        // the slower time starts where this one ended.
        return AutoMovieMotionHumanArmPlanned.within(
          context.handover,
          (): IAutoMovieMotionHumanActionPlan => prepare(context),
          refusal,
        );
      } catch (error: unknown) {
        const factor: number | undefined = slower(error);
        if (factor === undefined) throw error;
        const tempo: number = context.tempo ?? 1;

        // Time scaling is exact on a path that stays (Hollerbach 1984): the
        // factor a source names is the replan it needs. Where the base the
        // arms are written on moves with the action's time (a body lowering
        // under hands laid on its thighs) while its held spans keep their
        // seconds, the slower base moves the path once, and the source names
        // the rest of its need on that replan; past `REPLANS` the action is
        // refused with the time it needs, never iterated toward the bound.
        // The plan stops at the first group that refuses, so a replan that
        // meets that group's need can reveal another group's, stepped to in
        // turn.
        const source: string | undefined =
          refusal.error === error ? refusal.group : undefined;
        if ((needed.get(source) ?? 0) >= REPLANS) {
          // The time the action needs over the time it was first planned
          // at: what the author is told to give it.
          const total: number = (tempo / first) * factor;
          throw new HumanRefusal({
            kind: "reach",
            axis: "duration",
            value: total,
            feasible: null,
            reason: `the action needs at least ${total.toFixed(3)} times its time for its hands to move within the speed bound: replanned at ${(tempo / first).toFixed(3)} times its time, it still needs ${factor.toFixed(3)} times that`,
            fix: "give the action more time",
          });
        }
        needed.set(source, (needed.get(source) ?? 0) + 1);
        // The span a source had grows with the time scale as its moving
        // share does and keeps its held share's seconds, an affine law of
        // the scale; its first replan scales by the factor, and the second
        // takes the secant through the two refusals to the span it needs,
        // exact on that law.
        const read: ISpan = span(error)!;
        const last: ISample | undefined = sampled.get(source);
        const slope: number =
          last === undefined || tempo - last.tempo <= 0
            ? 0
            : (read.had - last.had) / (tempo - last.tempo);
        const secant: number =
          slope > 0 ? tempo + (read.needs - read.had) / slope : 0;
        sampled.set(source, { tempo, had: read.had });
        context.tempo = Math.max(secant, tempo * factor);
      }
    }
  }

  /*
   * The factor a refusal asks the action's time to grow by: a `duration`
   * refusal of a reach whose feasible range is the span its motion needs, over
   * the span it had; none for any other refusal.
   * Parameter error: What the plan threw.
   * Returns: The factor, greater than 1; undefined when the refusal asks no
   * more time.
   */
  export function slower(error: unknown): number | undefined {
    const read: ISpan | undefined = span(error);
    if (read === undefined) return undefined;
    const factor: number = read.needs / read.had;
    return factor > 1 ? factor : undefined;
  }
}

/*
 * Give a standalone preparation trial's solution to its next trial.
 */
function standalone<P>(
  context: IAutoMovieMotionHumanActionContext<P>,
): IAutoMovieMotionHumanActionContext<P> {
  const trajectory: IAutoMovieMotionHumanActionContext.IHandover["last"] =
    new Map();
  return { ...context, handover: { warm: trajectory, last: trajectory } };
}

/*
 * The span a speed refusal had and the span it needs, seconds; none for any
 * other refusal.
 */
function span(error: unknown): ISpan | undefined {
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
  return { had: error.value, needs: error.feasible.minimum };
}

/*
 * A speed refusal's span: what it had and what it needs, seconds.
 */
interface ISpan {
  /*
   * The span the motion had.
   */
  had: number;

  /*
   * The span it needs within the speed bound.
   */
  needs: number;
}

/*
 * One refusing source's last refusal: the time scale and the span it had there.
 */
interface ISample {
  /*
   * The action's time scale.
   */
  tempo: number;

  /*
   * The span the source had, seconds.
   */
  had: number;
}

/*
 * The replans one refusing source may have: the time-scaling step, and the
 * secant step a base whose moving spans slow while its held spans keep their
 * seconds needs after it.
 */
const REPLANS: number = 2;
