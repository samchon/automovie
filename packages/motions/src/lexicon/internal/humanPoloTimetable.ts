import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanPolo,
} from "@automovie/interface";

import { HumanBound } from "../../law/HumanBound";
import { HumanPoloForm } from "../HumanPoloForm";

/**
 * A polo stroke's timetable around its authored contact
 * (`HumanPoloForm.PHASES`): the take-away a down-swing and a take-away before
 * the contact, the top a down-swing before it, the finish a follow-through
 * after it and the settle after that; the lean out is at most `MOST` degrees,
 * `MOST` by default, the ball's speed positive (20 m/s by default), and the
 * contact leaves room for the lean, the take-away and the down-swing.
 *
 * @param params The lean, the speed and the contact second.
 * @returns The stroke's bounds, instants and cues.
 * @throws {HumanRefusal} When the lean lies outside 0 to `MOST`, the speed is
 *   not positive, or the contact comes too soon.
 */
export function humanPoloTimetable(
  params: Pick<IAutoMovieMotionHumanPolo.IPolo, "lean" | "speed" | "contact">,
): humanPoloTimetable.ITimetable {
  const lean: number = params.lean ?? HumanPoloForm.MOST;
  HumanBound.above("lean", lean, 0, "deg");
  HumanBound.within("lean", lean, 0, HumanPoloForm.MOST);
  const speed: number = params.speed ?? 20;
  HumanBound.above("speed", speed, 0, "m/s");
  const contact: number = params.contact;
  HumanBound.least(
    "contact",
    contact,
    HumanPoloForm.PHASES.lean +
      HumanPoloForm.PHASES.takeAway +
      HumanPoloForm.PHASES.down,
    "s",
  );
  const takeAway: number =
    contact - HumanPoloForm.PHASES.down - HumanPoloForm.PHASES.takeAway;
  const top: number = contact - HumanPoloForm.PHASES.down;
  const finish: number = contact + HumanPoloForm.PHASES.follow;
  const duration: number = finish + HumanPoloForm.PHASES.settle;
  return {
    lean,
    speed,
    contact,
    takeAway,
    top,
    finish,
    duration,
    events: [
      { name: "takeAway", share: takeAway / duration },
      { name: "top", share: top / duration },
      { name: "contact", share: contact / duration },
      { name: "finish", share: finish / duration },
    ],
  };
}

/** The polo stroke's timetable. */
export namespace humanPoloTimetable {
  /** The stroke's bounds and instants, seconds from the action's start. */
  export interface ITimetable {
    /** The lean out, degrees. */
    lean: number;

    /** The ball's speed off the head, m/s. */
    speed: number;

    /** The contact. */
    contact: number;

    /** The take-away. */
    takeAway: number;

    /** The top of the back-swing. */
    top: number;

    /** The finish. */
    finish: number;

    /** The stroke's whole seconds. */
    duration: number;

    /** The stroke's cues. */
    events: IAutoMovieMotionEvent[];
  }
}
