import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionManner,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";

/**
 * A court phrase's timetable: its own preparation and attack, a 0.22 s
 * follow-through, the held finish and a 0.34 s return. A contest's raised hands
 * hold 0.24 s; a release holds its finish 0.85 s while the ball leaves. The
 * manner scales the spans (`AutoMovieMotionManner.time`). The spans are
 * provisional.
 *
 * @param phrase The phrase's preparation and attack, seconds.
 * @param contest Whether the phrase is a high-hand contest rather than a
 *   release.
 * @param modifiers The manner's timing.
 * @returns The phrase clock.
 */
export function ballCourtClock(
  phrase: ballCourtClock.IPhrase,
  contest: boolean,
  modifiers: IAutoMovieMotionManner.IModifiers,
): IAutoMovieMotionClock {
  return AutoMovieMotionManner.time(
    AutoMovieMotionClock.phrase({
      prepare: phrase.prepare,
      attack: phrase.attack,
      follow: 0.22,
      hold: contest ? 0.24 : 0.85,
      retract: 0.34,
    }),
    modifiers,
  );
}

/** A court phrase's own spans. */
export namespace ballCourtClock {
  /** The preparation and the attack of one court phrase. */
  export interface IPhrase {
    /** Seconds into the stroke's start. */
    prepare: number;

    /** Seconds of the stroke to its release or its peak. */
    attack: number;
  }
}
