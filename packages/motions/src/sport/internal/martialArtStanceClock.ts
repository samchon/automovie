import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionManner,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import type { MartialArtStanceForms } from "./MartialArtStanceForms";

/**
 * A stance form's timetable: the lead step in (`ready`), the forward transfer
 * (`stroke`), the back transfer (`strokeEnd`), the held second stance (`relax`)
 * and the step back, each span the form's own (`MartialArtStanceForms.FORM`),
 * scaled by the manner.
 *
 * @param form The form's blocking: its step and transfer seconds.
 * @param hold Seconds the second stance is held.
 * @param manner The manner's timing.
 * @returns The phrase clock.
 */
export function martialArtStanceClock(
  form: Pick<MartialArtStanceForms.IForm, "step" | "shift">,
  hold: number,
  manner: IAutoMovieMotionManner.IModifiers,
): IAutoMovieMotionClock {
  return AutoMovieMotionManner.time(
    AutoMovieMotionClock.phrase({
      prepare: form.step,
      attack: form.shift[0],
      follow: form.shift[1],
      hold,
      retract: form.step,
    }),
    manner,
  );
}
