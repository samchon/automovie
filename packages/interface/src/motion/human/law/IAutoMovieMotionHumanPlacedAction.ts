import type { AutoMovieMotionHumanActionKey } from "../AutoMovieMotionHumanActionKey";
import type { IAutoMovieMotionHumanActionPlan } from "./IAutoMovieMotionHumanActionPlan";

/**
 * A resolved action placement available to another law: performer, action
 * family, plan and film-time boundaries. The plan remains evaluated on its own
 * action-local clock.
 */
export interface IAutoMovieMotionHumanPlacedAction {
  /** Its performer. */
  subject: string;

  /** Its name. */
  name: AutoMovieMotionHumanActionKey;

  /** The action it is a row of; its own name when it is none. */
  family: AutoMovieMotionHumanActionKey;

  /** Its parameters. */
  params: object;

  /** Its plan. */
  plan: IAutoMovieMotionHumanActionPlan;

  /** Film second of its law's time zero. */
  start: number;

  /** Film second it becomes active. */
  entryTime: number;

  /** Film second it stops: its cut or its end, as placed so far. */
  end: number;
}
