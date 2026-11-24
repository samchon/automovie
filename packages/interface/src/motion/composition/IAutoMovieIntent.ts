import type { AutoMovieHumanoidRegion } from "../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionTarget } from "../IAutoMovieMotionTarget";
import type { IAutoMovieRelationalGoal } from "./IAutoMovieRelationalGoal";

/**
 * One subject's intended action: the smallest unit a production composes.
 *
 * The engine never interprets `capability`; it is the production's own
 * vocabulary (a verb a subject can perform), so the same schedule machinery
 * serves any film. Timing, outcomes and state come from the production's pure
 * functions handed to `resolveAutoMovieSchedule`.
 */
export interface IAutoMovieIntent {
  /** Stable id of the acting subject. */
  subject: string;

  /** The production's capability name, such as a verb its subject class offers. */
  capability: string;

  /** Optional relation the action must realize against another subject. */
  goal?: IAutoMovieRelationalGoal;

  /**
   * Optional stable id other parts align to with `AutoMovieComposition.at`;
   * unique in a composition.
   */
  anchor?: string;

  /**
   * Production data the timing, outcome and state functions read; the engine
   * copies it untouched.
   */
  parameters?: Readonly<Record<string, unknown>>;

  /**
   * Cut the action short, as an interrupt (a cancel window in fighting-game
   * terms):
   *
   * - `{ share }`: at a share of its duration in [0, 1];
   * - `{ event }`: at one of its own named events
   *   (`resolveAutoMovieSchedule.ITiming.events`);
   * - `{ of, event }`: when an event of the intent anchored `of`, usually another
   *   subject's action, or of a cue track named `of`, happens; `index` picks
   *   which occurrence where the name repeats;
   * - `{ proximity }`: when the subject's `effector` region first comes within
   *   `distance` metres of `target` (zero is contact), which the production's
   *   `until` law finds from its motion; a proximity the motion never reaches
   *   cuts nothing, and the action runs to its end.
   *
   * The entry then ends at the cut and the next part of a sequence starts
   * there. The production's legality rules decide whether the cut is declared;
   * the resolver only places it. Absent, the action runs to its end.
   */
  until?:
    | {
        /**
         * Fraction of the full, uncut duration in [0, 1], checked by
         * AutoMovieScheduleCut.
         */
        share: number;
      }
    | {
        /**
         * First matching event from this intent's timing; missing names are
         * rejected.
         */
        event: string;
      }
    | {
        /**
         * Earlier placed intent's anchor, fixed cue track, or dynamically
         * supplied cue track.
         */
        of: string;
        /**
         * Event name within that anchor or track; matching preserves the source
         * event order.
         */
        event: string;
        /**
         * Zero-based occurrence among that name's events; defaults to zero and
         * is rejected when no occurrence exists.
         */
        index?: number;
      }
    | {
        /**
         * Geometric stopping request interpreted by the production's until law;
         * the scheduler validates only the returned share, not the distance or
         * target.
         */
        proximity: {
          /** The subject's own region that approaches. */
          effector: AutoMovieHumanoidRegion;
          /** What it approaches. */
          target: IAutoMovieMotionTarget;
          /** Distance at which the cut happens, metres; zero is contact. */
          distance: number;
        };
      };
}
