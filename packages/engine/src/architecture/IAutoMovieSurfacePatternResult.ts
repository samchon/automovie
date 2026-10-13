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
 * @evidence contracts/common.md#principled-implementation A value record of the run's three outputs joined by occurrence id, so every take-off figure and finding traces to a placement; its order is the run's fixed zone, row, column and generator order, never a hash or clock order.
 * @evidence contracts/common.md#clear-and-simple-design Placements, take-off and findings sit side by side in one result, so instancing and texturing read the placements they need without a second run or a join.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Measured defects stay as structured findings instead of being thrown or filtered, and no surviving occurrence is removed to make the take-off agree; only a module the region rejects entirely is absent.
 * @evidence contracts/common.md#meaningful-documentation States the producing function, the determinism across runs, the consumers that cite placement ids, the ordering of placements and findings, and what the take-off covers.
 * @evidenceExclude contracts/performance.md#cost-and-resources A plain output computing nothing; the run's lattice and neighbour-scan cost belongs to the generator, both transform functions read one result without rerunning it, and its size is one placement with its clipped outline per laid occurrence, bounded per zone by the lattice cell cap and released with the caller's reference.
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
