import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";

/** Data and callback contracts shared by the CheckLegality operations. */
export namespace IAutoMovieCheckLegality {
  /** A production rule. */
  export interface IRule {
    /** Stable rule id. */
    id: string;

    /** A violation text for this entry, or null when it holds. */
    check(
      entry: IAutoMovieSchedule.IEntry,
      schedule: IAutoMovieSchedule,
    ): string | null;
  }

  /** One violation. */
  export interface IViolation {
    /** The rule id. */
    rule: string;

    /** The entry's walk-order index. */
    entry: number;

    /** The rule's text. */
    detail: string;
  }
}
