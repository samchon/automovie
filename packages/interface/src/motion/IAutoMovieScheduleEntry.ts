import type { IAutoMovieIntent } from "./IAutoMovieIntent";
import type { IAutoMovieScheduleCue } from "./IAutoMovieScheduleCue";
import type { IAutoMovieScheduleCut } from "./IAutoMovieScheduleCut";

/** One placed intent. */
export interface IAutoMovieScheduleEntry {
  /** Walk-order index, stable for one composition. */
  readonly index: number;

  /** The acting subject's id. */
  readonly subject: string;

  /**
   * Authored intent retained by reference when its cut is already tagged or
   * absent. The resolver copies an intent with a legacy cut to carry the tag.
   */
  readonly intent: IAutoMovieIntent;

  /**
   * Absolute film seconds from composition origin zero; offsets may place
   * entries before zero.
   */
  readonly start: number;

  /**
   * Absolute film second of the declared contact, omitted if none is declared
   * or it lies after a cut.
   */
  readonly contact?: number;

  /** End, seconds; at least `start`. */
  readonly end: number;

  /** The production's outcome class, when its outcome function gives one. */
  readonly outcome?: string;

  /**
   * The production's state snapshot after this entry, when its state function
   * gives one.
   */
  readonly state?: unknown;

  /**
   * Where the intent was cut, when it was: the share of its full duration and
   * the event named, if any.
   */
  readonly cut?: Readonly<IAutoMovieScheduleCut.ICut>;

  /**
   * Named instants in absolute film seconds computed from the original full
   * duration, including events after a cut; repeated names retain declaration
   * order.
   */
  readonly events?: readonly Readonly<IAutoMovieScheduleCue>[];

  /**
   * The walk-order index of the entry that starts at this one's cut, when one
   * does.
   */
  readonly interruptedBy?: number;
}
