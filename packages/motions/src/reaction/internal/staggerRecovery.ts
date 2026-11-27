import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStagger,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTarget } from "../../compose/internal/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { StrikingTarget } from "../../striking/internal/StrikingTarget";
import { ReactionSource } from "./ReactionSource";
import { staggerBounds } from "./staggerBounds";
import { staggerLimit } from "./staggerLimit";
import { staggerPendulumEntry } from "./staggerPendulumEntry";
import { staggerRecover } from "./staggerRecover";

/*
 * Admit a stagger: read its push and lay the recovery that catches it.
 * Parameter context: The stagger's context.
 * Returns: The push, the entry geometry and the recovery, null when no `STEPS`
 * recovery steps catch the push.
 * When the speed is not positive or the manner is out of range.
 */
export function staggerRecovery(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStagger.IParams>,
): staggerRecovery.IAdmitted {
  const p: IAutoMovieMotionHumanStagger.IParams = context.params;
  if (!(p.speed > 0)) throw new Error("A stagger's speed is positive");
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const righting: number =
    AutoMovieMotionManner(context, p.manner).tempo *
    AutoMovieMotionHumanTiming.seconds(staggerBounds.RIGHTING);

  // The push, read where its source is as the plan begins, the causal read
  // a reaction makes (`ReactionSource`), and the recovery it asks for.
  const push: IAutoMovieVector3 = Vector3.normalize({
    ...AutoMovieMotionHumanTarget.away(
      ReactionSource.at(
        context,
        p.target,
        context.start - StrikingTarget.LOOK,
        entry,
        AutoMovieMotionHumanTarget.DEFAULTS.ahead,
      ),
      entry.root,
      entry.yaw,
    ),
    y: 0,
  });
  const fixed: staggerRecovery.Fixed = staggerPendulumEntry.prepare(
    context.body,
    context.entry,
  );
  const recovery: staggerRecover.IRecovery | null = staggerRecover.recover(
    context.body,
    context.entry,
    push,
    p.speed,
    righting,
    true,
    fixed,
  );
  return { push, righting, fixed, recovery };
}

/*
 * A stagger's admission: the push it reads and the recovery steps that catch
 * it, or none.
 *
 * The push is read where its source is as the plan begins, the causal read a
 * reaction makes (`ReactionSource`). The recovery is `staggerRecover`'s, whose
 * legs admit each step in closed form (`staggerAdmission`); a push no `STEPS`
 * recovery steps catch has no recovery, and `stagger` refuses it with the
 * fastest push this body catches that way, while `perturb` reads it as a fall.
 */
export namespace staggerRecovery {
  /*
   * The prepared entry geometry `staggerPendulumEntry.prepare` returns.
   */
  export type Fixed = ReturnType<typeof staggerPendulumEntry.prepare>;

  /*
   * A stagger's push, its prepared entry geometry and its recovery.
   */
  export interface IAdmitted {
    /*
     * The push's floor direction, world, unit length.
     */
    push: IAutoMovieVector3;

    /*
     * The righting's seconds, the manner's tempo applied.
     */
    righting: number;

    /*
     * The entry geometry the recovery and its limit read.
     */
    fixed: Fixed;

    /*
     * The recovery's steps and courses, or null when no steps catch the push.
     */
    recovery: staggerRecover.IRecovery | null;
  }

  /*
   * The refusal of a push no `STEPS` recovery steps catch: a fall, with the
   * fastest push this body catches that way.
   * Parameter context: The stagger's context.
   * Parameter admitted: The admission that found no recovery.
   * Returns: The `parameter` refusal on `speed`.
   */
  export function refusal(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStagger.IParams>,
    admitted: IAdmitted,
  ): AutoMovieMotionHumanRefusal {
    const { STEPS, VERIFIED, RESOLUTION }: typeof staggerBounds = staggerBounds;
    const speed: number = context.params.speed;
    const caught: number = staggerLimit(
      context.body,
      context.entry,
      admitted.push,
      speed,
      admitted.fixed,
    );
    return new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "speed",
      value: speed,
      feasible: { kind: "range", minimum: 0, maximum: caught, unit: "m/s" },
      reason: `a ${speed} m/s push this way is a fall: no ${STEPS} recovery steps within a person's measured step times and lengths and the legs' ranges catch it; this body catches up to ${caught.toFixed(2)} m/s pushed this way, to a centimetre per second, every push over the ${VERIFIED} m/s below it verified at every ${RESOLUTION} m/s`,
      fix: `push no harder than ${caught.toFixed(2)} m/s, or play the fall`,
    });
  }
}
