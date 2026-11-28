import type { AutoMovieArchetypeBandUnit } from "./AutoMovieArchetypeBandUnit";

/**
 * Inclusive finite interval with its measurement unit and source.
 *
 * A draw session uses the named dimension's seeded sample or the interval's
 * midpoint. An explicit finite value can use either endpoint.
 */
export interface IAutoMovieArchetypeBand {
  /** Inclusive lower endpoint in `unit`. */
  minimum: number;

  /**
   * Inclusive upper endpoint in `unit`. When equal to `minimum`, the band fixes the value.
   */
  maximum: number;

  /** Shared measurement unit of both endpoints. */
  unit: AutoMovieArchetypeBandUnit;

  /** Measurement, reference or estimate used to set the interval. */
  source: string;

  /** True when the interval is estimated or relies on a secondary source. */
  provisional?: boolean;
}
