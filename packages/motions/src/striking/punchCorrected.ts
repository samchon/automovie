import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanStrikingAim,
  IAutoMovieSuperposeMinimumJerk,
  IAutoMovieVector3,
} from "@automovie/interface";

import { punchContact } from "./punchContact";
import type { punchReach } from "./punchReach";

/**
 * The delivery's tracker: the planned contact point, with each correction a
 * minimum-jerk unit carrying the wrist to where its own solution lands
 * (`contact.corrected`).
 *
 * Part of `punchGeometry.build`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `corrected`.
 */
export function punchCorrected(
  prepared: punchCorrected.IPrepared,
): IAutoMovieMotionHumanStrikingAim.ITracker {
  const { tracker, contact }: punchCorrected.IPrepared = prepared;
  return {
    planned: tracker.planned,
    units: (seconds: number): IAutoMovieSuperposeMinimumJerk.IUnit[] =>
      contact.corrected(seconds).map(
        (c: punchReach.ICorrection): IAutoMovieSuperposeMinimumJerk.IUnit => ({
          displacement: c.end,
          start: c.start,
          duration: c.duration,
        }),
      ),
    goal: (seconds: number): IAutoMovieVector3 =>
      contact
        .corrected(seconds)
        .reduce(
          (
            g: IAutoMovieVector3,
            c: punchReach.ICorrection,
          ): IAutoMovieVector3 => Vector3.add(g, c.end),
          tracker.planned,
        ),
  };
}

/** The `corrected` of `punchGeometry.build`, built from what that plan prepared. */
export namespace punchCorrected {
  /** What `punchGeometry.build` prepared for its `corrected`. */
  export interface IPrepared {
    /** The `tracker` `punchGeometry.build` prepared. */
    tracker: punchContact.IContact["tracker"];

    /** The `contact` `punchGeometry.build` prepared. */
    contact: punchContact.IContact;
  }
}
