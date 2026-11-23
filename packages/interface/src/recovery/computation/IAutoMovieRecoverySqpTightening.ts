/** Current-model scalar choice for one strict inward correction target. */
export interface IAutoMovieRecoverySqpTightening {
  /** Original physical mixed-step norm raised to 2.5; null for overflow. */
  ceiling: number | null;

  /** Prepared positive inward length, or null when scalar support is absent. */
  value: number | null;

  /** Computed -f*p for the actual mixed physical direction; null if nonfinite. */
  descent: number | null;

  /**
   * Same-QP sum of original multipliers times physical row norms; null if
   * unresolved.
   */
  multiplierPrice: number | null;

  /**
   * Scalar support branch, independent of factor, actual feasibility and normal
   * status.
   */
  reason:
    | "original-ceiling"
    | "zero-multiplier-price"
    | "objective-cap"
    | "tightening-unresolved"
    | "descent-unresolved"
    | "multiplier-price-unresolved"
    | "cap-unresolved";
}
