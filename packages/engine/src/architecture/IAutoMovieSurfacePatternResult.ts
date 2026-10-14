import { IAutoMoviePatternFinding } from "./IAutoMoviePatternFinding";
import { IAutoMoviePatternPlacement } from "./IAutoMoviePatternPlacement";
import { IAutoMoviePatternQuantities } from "./IAutoMoviePatternQuantities";

/**
 * Everything one run of {@link generateAutoMovieSurfacePattern} produces.
 *
 * Stable inputs and a pure generator repeat within the same numerical runtime. Mesh/instance/texture consumers cite the placements by occurrence id; quantities cover those placements. Quality defects of an accepted declaration are findings naming occurrence ids rather than thrown errors.
 *
 * @evidence contracts/common.md#principled-implementation Co-locates one run's placements, take-off and findings so consumers can trace quantities and findings to occurrence ids. This mutable structural record does not prevent a caller from replacing fields or mixing runs; consumers must preserve its provenance.
 * @evidence contracts/common.md#clear-and-simple-design Four members: the pattern id, the placements every consumer cites, the quantities over those placements, and the findings, with no derived view a consumer could compute itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Defects of a valid declaration are data in `findings` rather than exceptions, so a consumer decides what to tolerate and nothing is silently dropped to make a run pass.
 * @evidence contracts/common.md#meaningful-documentation States the determinism across runs, which consumers cite placements by id, that quantities cover exactly the placements, and the order of placements and findings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A result shape without behavior; producing it is answered on `generateAutoMovieSurfacePattern`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The run caches nothing; a consumer reading instance and texture transforms passes this one result to both rather than re-running the pattern.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the arrays. The per-zone cell cap does not cap callback output per cell or quadratic pair findings; retained size follows actual placements and findings.
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
