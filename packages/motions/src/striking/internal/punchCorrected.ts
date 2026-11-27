import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanStrikingAim,
  IAutoMovieSuperposeMinimumJerk,
  IAutoMovieVector3,
} from "@automovie/interface";

import { PreparedHumanIntervals } from "../../perform/PreparedHumanIntervals";
import type { punchContact } from "./punchContact";
import type { punchReach } from "./punchReach";

/** The correction's displacement and its minimum-jerk time window. */
type Correction = Pick<punchReach.ICorrection, "end" | "start" | "duration">;

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
  const units: IAutoMovieSuperposeMinimumJerk.IUnit[] = contact
    .corrected(Infinity)
    .map(
      (c: Correction): IAutoMovieSuperposeMinimumJerk.IUnit => ({
        displacement: c.end,
        start: c.start,
        duration: c.duration,
      }),
    );
  const goals: IAutoMovieVector3[] = [tracker.planned];
  for (const unit of units)
    goals.push(Vector3.add(goals.at(-1)!, unit.displacement));
  const startAt = (index: number): number => units[index]!.start;
  const arrived = (seconds: number): number =>
    PreparedHumanIntervals.upperBound(units.length, startAt, seconds);
  return {
    planned: tracker.planned,
    units: (seconds: number): readonly IAutoMovieSuperposeMinimumJerk.IUnit[] =>
      units.slice(0, arrived(seconds)),
    goal: (seconds: number): IAutoMovieVector3 => ({
      ...goals[arrived(seconds)]!,
    }),
  };
}

/** The `corrected` of `punchGeometry.build`, built from what that plan prepared. */
export namespace punchCorrected {
  /** What `punchGeometry.build` prepared for its `corrected`. */
  export interface IPrepared {
    /** The `tracker` `punchGeometry.build` prepared. */
    tracker: Pick<punchContact.IContact["tracker"], "planned">;

    /** Contact corrections available at a film second. */
    contact: {
      /** Read the displacement and timing of every correction for this goal. */
      corrected: (seconds: number) => readonly Correction[];
    };
  }
}
