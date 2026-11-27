import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanRacket,
  IAutoMovieMotionManner,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";

/**
 * A solo racket or golf position's timetable: into the position in 0.6 s, the
 * stroke (the split step's hop, the golf address's settling in 1.2 s, the ready
 * position's 0.3 s), the held position and the 0.6 s return. The manner's hold
 * scales the held span and its tempo the rest, except a split step's hop, whose
 * flight the tempo cannot slow.
 *
 * @param kind The position.
 * @param hold Seconds the position is held.
 * @param modifiers The manner's timing.
 * @returns The phrase clock.
 */
export function racketClock(
  kind: IAutoMovieMotionHumanRacket.Position,
  hold: number,
  modifiers: IAutoMovieMotionManner.IModifiers,
): IAutoMovieMotionClock {
  return AutoMovieMotionManner.time(
    AutoMovieMotionClock.phrase({
      prepare: 0.6,
      attack: kind === "golfAddress" ? 1.2 : 0.3,
      hold,
      retract: 0.6,
    }),
    modifiers,
    {
      holds: ["strokeEnd"],
      fixed: kind === "splitStep" ? ["strokeStart"] : [],
    },
  );
}
