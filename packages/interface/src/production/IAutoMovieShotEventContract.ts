import { IAutoMovieShotPredicate } from "./IAutoMovieShotPredicate";

/** A time-bounded event the shot source must implement. */
export interface IAutoMovieShotEventContract {
  /** Stable event id. */
  id: string;

  /** Event family. */
  kind: "contact" | "arrival" | "break" | "reveal" | "transition";

  /** Inclusive finite event window inside the owning shot's duration. */
  window: {
    /** Earliest valid time. */
    from: number;

    /** Latest valid time. */
    to: number;
  };

  /** Non-empty unique actor, formation or object ids involved. */
  subjects: string[];

  /** Non-empty machine-checkable facts required at the realized event time. */
  predicates: IAutoMovieShotPredicate[];
}
