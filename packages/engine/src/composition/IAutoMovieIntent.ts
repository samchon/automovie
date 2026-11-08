import type { IAutoMovieRelationalGoal } from "./IAutoMovieRelationalGoal";

/**
 * One subject's intended action: the smallest unit a production composes.
 *
 * The engine never interprets `capability`; it is the production's own
 * vocabulary (a verb a subject can perform), so the same schedule machinery
 * serves any film. Timing, outcomes and state come from the production's
 * pure functions handed to `resolveAutoMovieSchedule`.
 */
export interface IAutoMovieIntent {
  /** Stable id of the acting subject. */
  subject: string;

  /** The production's capability name, such as a verb its subject class offers. */
  capability: string;

  /** Optional relation the action must realize against another subject. */
  goal?: IAutoMovieRelationalGoal;

  /** Optional stable id other parts align to with `AutoMovieComposition.at`; unique in a composition. */
  anchor?: string;

  /** Production data the timing, outcome and state functions read; the engine copies it untouched. */
  parameters?: Readonly<Record<string, unknown>>;
}
