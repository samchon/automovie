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
 * @evidence contracts/common.md#principled-implementation One run's placements, take-off and findings travel together, so every quantity and finding is traceable to the occurrence ids it counted and a consumer cannot pair a take-off with a different run.
 * @evidence contracts/common.md#clear-and-simple-design Four members: the pattern id, the placements every consumer cites, the quantities over those placements, and the findings, with no derived view a consumer could compute itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Defects of a valid declaration are data in `findings` rather than exceptions, so a consumer decides what to tolerate and nothing is silently dropped to make a run pass.
 * @evidence contracts/common.md#meaningful-documentation States the determinism across runs, which consumers cite placements by id, that quantities cover exactly the placements, and the order of placements and findings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A result shape without behavior; producing it is answered on `generateAutoMovieSurfacePattern`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The run caches nothing; a consumer reading instance and texture transforms passes this one result to both rather than re-running the pattern.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the result; its placement count is bounded by the zones' lattice cap times the modules each cell returns.
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
