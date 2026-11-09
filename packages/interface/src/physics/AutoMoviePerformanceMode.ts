/**
 * Per-scene default and per-body override; exaggerated factors are explicit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Per-scene default and per-body override; exaggerated factors are explicit) as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Per-scene default and per-body override; exaggerated factors are explicit: type alias of 0 members (). It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMoviePerformanceMode` in packages/interface/src/physics/AutoMoviePerformanceMode.ts; its surface is the 0 members listed and the text shows 4 other files naming it, mostly packages/engine (3), packages/interface (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export type AutoMoviePerformanceMode =
  | {
      /** Authored motion and geometric receipts, with no solver. */ kind: "kinematic";
    }
  | { /** Bounded tracking and solver contacts. */ kind: "simulated" }
  | {
      /** Solver behavior with reviewed departures. */ kind: "exaggerated";
      /** Positive multiplier on incoming impulses. */ impulse: number;
      /** Nonnegative multiplier on gravity. */ gravity: number;
      /** Positive multiplier on contact compliance. */ compliance: number;
      /** Screenplay/settings reason for the departure. */ reason: string;
    };
