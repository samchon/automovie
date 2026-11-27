import { AutoMovieEngineMotionSampling, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanKuzushi,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanLean } from "../../compose/internal/AutoMovieMotionHumanLean";
import { HumanBound } from "../../law/internal/HumanBound";

/*
 * A broken base (kuzushi): the receiver of a judo throw drawn off balance
 * forward, the whole body tipped about the ankles over the toes while the feet
 * stay on the floor, the stage before a throw carries the body over.
 *
 * The body turns as one about the midpoint of its two ankles by `depth` degrees
 * forward over `TIP` seconds, holds there for `hold` seconds and comes back
 * over `TIP` seconds; the feet keep their planted goals, so the ankles bend and
 * the centre of mass passes ahead of the toes. A balanced person leans from the
 * hips and moves them back (`gestureBow.bowed`); a broken base is the lean that
 * does not, which is what the partner's pull and the thrower's entry produce.
 *
 * What follows, the body carried over the thrower's hip and its fall, is set by
 * the forces of the throw and is the force-determined follow-up, not staged
 * here; nor are the receiver's grips and the breakfall.
 *
 * Events: `broken` when the lean is full, `relax` when it starts back.
 */
export namespace kuzushi {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionKey = "kuzushi";

  /*
   * Cancel table: a broken base may be cut into anything once it is full, as a
   * throw cuts it.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [
      { window: { start: "broken", end: 1 }, kind: "inertialize", entry: 0 },
    ],
  };

  /*
   * Seconds the body takes to tip and to come back (provisional).
   */
  export const TIP: number = 0.5;

  /*
   * How far forward the body tips when none is asked, degrees (provisional:
   * past the toes for an adult).
   */
  export const DEPTH: number = 15;

  /*
   * How far a kuzushi has tipped the body at a second: a minimum-jerk tip over
   * `TIP`, held `hold`, and a minimum-jerk return over `TIP`.
   * Parameter hold: The held seconds.
   * Parameter seconds: The action's seconds.
   * Returns: The tip's share, 0 to 1.
   */
  export function tipped(hold: number, seconds: number): number {
    const t: number = Math.min(2 * TIP + hold, Math.max(0, seconds));
    return t < TIP
      ? AutoMovieEngineMotionSampling.minimumJerkShare(t / TIP)
      : t <= TIP + hold
        ? 1
        : 1 -
          AutoMovieEngineMotionSampling.minimumJerkShare(
            (t - TIP - hold) / TIP,
          );
  }
  /*
   * Plan a broken base.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the depth lies outside (0, 30] degrees or the
   * hold is negative.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKuzushi.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanKuzushi.IParams = context.params;
    const depth: number = p.depth ?? DEPTH;
    HumanBound.within("depth", depth, 0, 30, "degrees", "minimum");
    const hold: number = p.hold ?? 1;
    HumanBound.least("hold", hold, 0, "s");
    const duration: number = 2 * TIP + hold;
    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, duration);

    // The pivot: the planted ankles' midpoint in the world. The body turns
    // about it from the base's own posture, so a body entered with bent
    // knees or swaying keeps its root where no tip is added.
    const feet: IAutoMovieMotionHumanActionContext["entry"]["feet"] =
      context.entry.feet;
    const pivot: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
      AutoMovieEngineVector3.add(feet.left.ankle, feet.right.ankle),
      0.5,
    );
    return {
      duration,
      events: [
        { name: "broken", share: TIP / duration },
        { name: "relax", share: (TIP + hold) / duration },
      ],
      contacts: base.contacts,
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const s: number = tipped(hold, t);
        return AutoMovieMotionHumanLean.about(base.posture(t), pivot, {
          pitch: depth * s,
          roll: 0,
        });
      },
    };
  }
}
