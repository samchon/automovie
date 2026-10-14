import type { IHumanFacePeriocularMappingReading } from "../anatomy/eye/structures/IHumanFacePeriocularMappingReading";

/**
 * Diagnostic mapping of one actual constructed tissue, separate from unchanged physical admission.
 *
 * @evidence contracts/common.md#principled-implementation Actual constructed tissue identity accompanies the mapping reader's source-material, sampled-skin and outer/inner offset observations without replacing the unchanged physical admission result.
 * @evidence contracts/common.md#clear-and-simple-design One subject and one canonical reading separate attribution from numerical mapping fields and retained original crossing witnesses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing legacy material coordinates stay null rather than zero folds; transverse crossing diagnostics supply neither new tolerances nor clinical or visual acceptance.
 * @evidence contracts/common.md#meaningful-documentation The report is explicitly diagnostic and its reading owner distinguishes Float64 material signs from published local Float32 spatial observations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This transport record performs no crossing census or material-area calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Mapping memoization belongs to the generated part's reader closure, not this report.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the observation and witness arrays; this record creates no new geometry query or task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularMappingReport {
  /** Actual generated tissue identity. */
  subject: string;

  /** Actual source, pre-offset and offset observations. */
  reading: IHumanFacePeriocularMappingReading;
}
