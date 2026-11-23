import type { IAutoMovieShotPredicate } from "./IAutoMovieShotPredicate";

/**
 * A semantic event the shot source must realize once inside an inclusive
 * shot-local window.
 */
export interface IAutoMovieShotEventContract {
  /** Stable event id. */
  id: string;

  /** Event family. */
  kind: "contact" | "arrival" | "break" | "reveal" | "transition";

  /** Inclusive finite event window inside the owning shot's duration. */
  window: {
    /** Earliest valid shot-local time in seconds, inclusive. */
    from: number;

    /** Latest valid shot-local time in seconds, inclusive. */
    to: number;
  };

  /** Non-empty unique actor, formation or object ids involved. */
  subjects: string[];

  /** Non-empty machine-checkable facts required at the realized event time. */
  predicates: IAutoMovieShotPredicate[];
}
