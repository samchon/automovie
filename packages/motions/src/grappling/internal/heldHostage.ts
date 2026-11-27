import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHostageHold,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { PairWalk } from "./PairWalk";

/**
 * The hostage of a hold (`IAutoMovieMotionHumanHostageHold.IHeld`): the body
 * keeps the posture it entered with and walks backward with the holder for
 * `SECONDS`, its root following the holder's displayed root and its feet
 * stepping the same displacement, so the pair keeps its order. The holder is
 * composed before the hostage, so its root is placed to be read.
 */
export namespace heldHostage {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "heldHostage";

  /** Cancel table: none. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /**
   * How long the hostage is held, seconds: authored, the hold's default with
   * its reach and the walk back.
   */
  export const SECONDS: number = 5;

  /**
   * Plan the hostage.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHostageHold.IHeld>,
  ): IAutoMovieMotionHumanActionPlan {
    const holder: ReturnType<typeof context.performer> = context.performer(
      context.params.partner,
    );
    const origin: IAutoMovieVector3 = holder.root(context.start).position;
    const duration: number = SECONDS;
    const moved: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 =>
      Vector3.subtract(holder.root(context.start + t).position, origin);
    const travel: IAutoMovieVector3 = moved(duration);
    const steps: PairWalk.IStep[] = PairWalk.steps(
      context.entry,
      travel,
      0,
      duration,
    );
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const hip: number = context.body.measure.hipHeight;
    const knee: (ankle: IAutoMovieVector3) => IAutoMovieVector3 = (
      ankle: IAutoMovieVector3,
    ): IAutoMovieVector3 => Vector3.add(ankle, { x: 0, y: 0.45 * hip, z: 0 });
    const events: IAutoMovieMotionEvent[] = [{ name: "held", share: 0 }];
    return {
      duration,
      events,
      contacts: PairWalk.plants(steps, duration),
      posture: (t: number): IAutoMovieMotionHumanPosture => {
        const s: number = Math.min(duration, Math.max(0, t));
        return {
          ...entry,
          root: Vector3.add(entry.root, { ...moved(s), y: 0 }),
          limbs: {
            ...entry.limbs,
            ...PairWalk.legs(context.entry, steps, s, knee),
          },
        };
      },
    };
  }
}
