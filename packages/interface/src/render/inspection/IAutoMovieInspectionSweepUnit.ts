/**
 * One topmost selected inspection path and the other objects intersecting its
 * expanded world box. expandAutoMovieInspectionSweep returns alone as a
 * singleton unit list and neighbours in source order; neighbours exclude
 * descendants already inside the unit and may be empty.
 */
export interface IAutoMovieInspectionSweepUnit {
  /** Topmost path matching the sweep pattern; empty names the root. */
  unit: string;
  /** Singleton selection containing unit. */
  alone: string[];
  /**
   * Other object paths intersecting the unit's margin-expanded box, in source
   * order; empty when isolated.
   */
  neighbours: string[];
}
