import { IAutoMovieShotPredicate } from "./IAutoMovieShotPredicate";

/**
 * A semantic event the shot source must realize once inside an inclusive shot-local window.
 *
 * @evidence contracts/development/design.md#principled-representation Realization requires an exact finite event sample inside its admitted time window, every declared subject to resolve and every typed predicate to pass against compiled output at that sample.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A closed event family and explicit subjects describe semantic ownership, while predicates supply independent measurable facts instead of encoding motion in the contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Repeating the event id or prose is insufficient; missing, duplicate or out-of-window samples and unresolvable subjects fail rather than being silently dropped.
 * @evidence contracts/development/common.md#meaningful-documentation Defines stable event identity, family, inclusive second window, unique subjects and nonempty machine-checkable obligations.
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
