import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanInstance,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { HumanRefusal } from "../../law/HumanRefusal";
import { prepareInstancePosture } from "./prepareInstancePosture";

/*
 * An instanced member: a performer that displays a template member's placed
 * posture, read whole film frames earlier and moved rigidly by the offset it
 * stands at from the template, so a rear rank marching with its front rank
 * costs no plans and no fits of its own.
 *
 * At its start the law reads where it stands relative to the template, in the
 * template's heading frame: an offset and a turn. Each posture is the
 * template's at `t - shift / 24` with the root, every limb goal's world point
 * and bend, and every goal's rotation moved by that offset and turn about the
 * template's root; a goal's contact lies in its end joint's own rest frame and
 * turns with the joint, so it is kept; joint angles are the template's. So the
 * instance's feet are planted where the template's are, moved, and a gaze layer
 * on it still looks at its own target. The move stays rigid only while the
 * template keeps its heading, so a span in which the template turns by more
 * than `TURN` refuses (a wheel needs full members), and so does a template on
 * another body, whose limbs the instance would carry. A goal attached to a bone
 * is in that bone's frame and is kept; a goal that keeps clear of or rests on
 * world colliders is refused, since those belong to the template's place. The
 * instance gives up its own per-step draws for one whole-frame shift: the
 * declared price of `IHumanEnsemble.detail`.
 *
 * Its contact windows are none: a planted goal it carries is the template's,
 * moved, and the slip of an instance is the template's own.
 */
export namespace instance {
  /*
   * The law's name.
   */
  export const name: AutoMovieMotionHumanActionKey = "instance";

  /*
   * Degrees the template may turn over the span before the move is no longer
   * rigid (provisional: a degree moves a member a metre out by under 2 cm).
   */
  export const TURN: number = 1;

  /*
   * The film's frame rate, frames a second, the unit of `shift`.
   */
  export const RATE: number = 24;

  /*
   * The cuts: any action may follow it at any instant, inertialized.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [
      {
        window: { start: 0, end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /*
   * Plan an instance.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the template is on another body, turns over the
   * span, or carries a goal kept clear of world colliders.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanInstance.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanInstance.IParams = context.params;
    const shift: number = Math.round(p.shift ?? 0);
    if (!(p.duration > 0) || !(shift >= 0))
      throw new HumanRefusal({
        kind: "parameter",
        axis: p.duration > 0 ? "shift" : "duration",
        value: p.duration > 0 ? shift : p.duration,
        reason:
          "an instance lasts a positive time and lags by a whole number of frames",
        fix: "give a positive span and a whole, nonnegative shift",
      });
    return {
      duration: p.duration,
      events: [],
      contacts: [],
      posture: prepareInstancePosture({
        name: p.of,
        template: context.performer(p.of),
        body: context.body,
        entered: context.entry.posture,
        start: context.start,
        duration: p.duration,
        lag: shift / RATE,
        turnLimit: TURN,
        rate: RATE,
      }),
    };
  }
}
