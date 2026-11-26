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
   * - `{ type: "share", share }`: at a share of its duration in [0, 1];
   * - `{ type: "event", event }`: at one of its own named events
   *   (`resolveAutoMovieSchedule.ITiming.events`);
   * - `{ type: "anchor-event", of, event }`: when an event of the intent anchored
   *   `of`, usually another subject's action, or of a cue track named `of`,
   *   happens; `index` picks which occurrence where the name repeats;
   * - `{ type: "proximity", proximity }`: when the subject's `effector` region
   *   first comes within `distance` metres of `target` (zero is contact), which
   *   the production's `until` law finds from its motion; a proximity the
   *   motion never reaches cuts nothing, and the action runs to its end.
   *
   * The scheduler also accepts the exact untagged shapes above from persisted
   * older payloads and normalizes them before scheduling.
   *
   * The entry then ends at the cut and the next part of a sequence starts
   * there. The production's legality rules decide whether the cut is declared;
   * the resolver only places it. Absent, the action runs to its end.
   */
  until?: IAutoMovieIntent.IUntil;
}

export namespace IAutoMovieIntent {
  /** A tagged cut request accepted by a composition intent. */
  export type IUntil =
    | IUntilShare
    | IUntilEvent
    | IUntilAnchorEvent
    | IUntilProximity;

  /** Cut at a share of the intent's duration. */
  export interface IUntilShare {
    /** Discriminator for a duration share. */
    type: "share";
    /** Fraction of the full, uncut duration in [0, 1]. */
    share: number;
  }

  /** Cut at one of the intent's own named events. */
  export interface IUntilEvent {
    /** Discriminator for an event of this intent. */
    type: "event";
    /** Event name in this intent's timing. */
    event: string;
  }

  /** Cut at a named event of an earlier anchor or cue track. */
  export interface IUntilAnchorEvent {
    /** Discriminator for an event from another anchor or cue track. */
    type: "anchor-event";
    /** Earlier placed intent's anchor or cue track id. */
    of: string;
    /** Event name in that anchor or track. */
    event: string;
    /** Zero-based occurrence among events with this name; defaults to zero. */
    index?: number;
  }

  /** Cut when the until law reports the requested proximity. */
  export interface IUntilProximity {
    /** Discriminator for a geometric proximity cut. */
    type: "proximity";
    /** Geometric stopping request interpreted by the production's until law. */
    proximity: IProximity;
  }

  /** Geometric request interpreted by a production's until law. */
  export interface IProximity {
    /** The subject's own region that approaches. */
    effector: AutoMovieHumanoidRegion;
    /** What it approaches. */
    target: IAutoMovieMotionTarget;
    /** Distance at which the cut happens, metres; zero is contact. */
    distance: number;
  }
}
