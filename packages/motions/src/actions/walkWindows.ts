import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanWalkSteps,
} from "@automovie/interface";

import { walkReach } from "./walkReach";

/** The alternatives of `OfPushKind2`'s site. */
type OfPushKind2 = "plant" | "pivot";

/** The alternatives of `OfPushKind`'s site. */
type OfPushKind = "plant" | "pivot";

/** The alternatives of `OfPart`'s site. */
type OfPart = "leftFoot" | "rightFoot";

/**
 * The events and contact windows of a gait's footstep plan.
 *
 * @param steps The gait's footstep plan.
 * @returns The plan's named instants and its stances' windows, in the stances'
 *   order, as shares of the plan's duration.
 */
export function walkWindows(
  steps: IAutoMovieMotionHumanWalkSteps.IPlan,
): IWindows {
  const duration: number = steps.duration;
  const events: IAutoMovieMotionEvent[] = [];
  for (const event of steps.events)
    events.push({ name: event.name, share: event.seconds / duration });
  const contacts: IAutoMovieMotionHumanContactWindow[] = [];
  for (const stance of steps.stances) {
    const part: OfPart = stance.side === "left" ? "leftFoot" : "rightFoot";
    const push: (kind: OfPushKind, from: number, to: number) => void = (
      kind: OfPushKind2,
      from: number,
      to: number,
    ): void => {
      contacts.push({
        part,
        kind,
        from: from / duration,
        to: to / duration,
        support: { kind: "ground" },
      });
    };
    let start: number = stance.from;
    const spins: (t: number) => boolean = (t: number): boolean =>
      walkReach.footPivot(steps.yaw(t), steps.foot(stance.side, t)) !== 0;
    let spinning: boolean = spins(stance.from);
    for (
      let t: number = stance.from + walkWindows.STEP;
      t < stance.to - 1e-9;
      t += walkWindows.STEP
    ) {
      const now: boolean = spins(t);
      if (now === spinning) continue;
      push(spinning ? "pivot" : "plant", start, t);
      start = t;
      spinning = now;
    }
    push(spinning ? "pivot" : "plant", start, stance.to);
  }
  return { events, contacts };
}

/**
 * What a stepping gait declares of its footstep plan, as shares of its length:
 * each named instant, and the floor contacts, each foot's stance a `plant` but
 * for the spans in which the foot spins on its ball, which are a `pivot` on its
 * toe pad.
 *
 * A pelvis turned from a stance foot further than the hip rotates is taken by
 * spinning on the ball of that foot (`walkReach.pelvis`), as a person spins on
 * the stance foot in a spin turn (Hase and Stein 1999). The foot then turns on
 * the floor about its toe pad, so it is declared as turning about the contact
 * there, never as fixed.
 */
export namespace walkWindows {
  /**
   * The spacing, seconds, at which a stance is read for its spin: half a frame
   * at 60 frames a second.
   */
  export const STEP: number = 1 / 120;
}

/** The distinct events and contact windows on a gait's clock. */
interface IWindows {
  events: IAutoMovieMotionEvent[];
  contacts: IAutoMovieMotionHumanContactWindow[];
}
