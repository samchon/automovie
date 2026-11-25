import type { IAutoMoviePatternFinding } from "./IAutoMoviePatternFinding";
import type { IAutoMoviePatternPlacement } from "./IAutoMoviePatternPlacement";
import type { IAutoMoviePatternQuantities } from "./IAutoMoviePatternQuantities";

/**
 * Everything one run of {@link generateAutoMovieSurfacePattern} produces.
 *
 * Stable inputs and a pure generator repeat within the same numerical runtime.
 * Mesh/instance/texture consumers cite the placements by occurrence id;
 * quantities cover those placements. Quality defects of an accepted declaration
 * are findings naming occurrence ids rather than thrown errors.
 */
export interface IAutoMovieSurfacePatternResult {
  /** The pattern that produced this run. */
  id: string;

  /** Occurrences in zone, row, column, then generator order. */
  placements: IAutoMoviePatternPlacement[];

  /**
   * The take-off over {@link placements}: counts, covered, consumed, waste and
   * joint figures, overall and per zone.
   */
  quantities: IAutoMoviePatternQuantities;

  /** Structured defects, per-occurrence ones first, then per-pair ones. */
  findings: IAutoMoviePatternFinding[];
}
