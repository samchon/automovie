import { IAutoMoviePatternFinding } from "./IAutoMoviePatternFinding";
import { IAutoMoviePatternPlacement } from "./IAutoMoviePatternPlacement";
import { IAutoMoviePatternQuantities } from "./IAutoMoviePatternQuantities";

/**
 * Everything one run of {@link generateAutoMovieSurfacePattern} produces.
 *
 * Two runs of the same declaration produce identical results. The placements
 * are the occurrences the mesh, {@link autoMoviePatternInstanceTransforms}, and
 * {@link autoMoviePatternTextureTransforms} all cite by id; the quantities are
 * the take-off over exactly those placements; and a defect of a valid
 * declaration is a finding naming occurrence ids rather than a thrown error.
 *
 * @author Samchon
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
