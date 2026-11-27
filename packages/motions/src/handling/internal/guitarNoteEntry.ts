import type {
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanGuitarNote,
  IAutoMovieMotionHumanPropReader,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/** A note's ordered contact times in seconds. */
type NoteTimes = "stopAt" | "pluckAt" | "releaseAt" | "duration";

/** Admission rules for the coordinated contacts of a staged guitar note. */
export namespace guitarNoteEntry {
  /** Admit strictly increasing contact and clearance times. */
  export function timing(
    p: Pick<IAutoMovieMotionHumanGuitarNote, NoteTimes>,
  ): void {
    const { stopAt, pluckAt, releaseAt, duration } = p;
    if (!(0 < stopAt && stopAt < pluckAt && pluckAt < releaseAt && releaseAt < duration))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "stopAt",
        value: [stopAt, pluckAt, releaseAt, duration],
        reason: "the note needs strictly increasing finite times from entry to clearance",
        fix: "give 0 < stopAt < pluckAt < releaseAt < duration in seconds",
      });
  }

  /** Admit the two free fingers the note uses. */
  export function hands(holds: IAutoMovieMotionHumanEntryState["holds"]): void {
    if (holds.left !== undefined || holds.right !== undefined)
      throw new HumanRefusal({
        kind: "channel",
        axis: "hands",
        value: holds,
        reason: "the stopped note uses both index fingers",
        fix: "place the guitar on a support and free both hands before the note",
      });
  }

  /** Admit a guitar independently staged on a fixed frame. */
  export function instrument(
    subject: string,
    prop: Pick<IAutoMovieMotionHumanPropReader["prop"], "fixed" | "motion" | "worn" | "mounted">,
  ): void {
    if (prop.fixed !== true || prop.motion !== undefined || prop.worn !== undefined || prop.mounted !== undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "prop",
        value: subject,
        reason: "guitarNote takes a stationary, independently staged guitar",
        fix: "stage the guitar on its support with a fixed frame",
      });
  }
}
