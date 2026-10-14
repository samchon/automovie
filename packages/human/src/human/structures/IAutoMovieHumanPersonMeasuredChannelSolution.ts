import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonMeasurementReading } from "./IAutoMovieHumanPersonMeasurementReading";

/**
 * A solved person measurement: the new document, its instrument's Float32 rest-geometry reading, and whether the target lies within the measurement's observed source-sample range. Girth reads the full evaluator; stature reads the lighter compiled rest skin, whose agreement with the full result requires the omitted stages to leave that skin unchanged.
 *
 * @evidence contracts/common.md#principled-implementation A new solved document, its actual rest-instrument reading and target-range classification distinguish achieved geometry from source-population metadata; stature does not run all final contact and closure stages.
 * @evidence contracts/common.md#clear-and-simple-design The solution carries the target's population status without turning that status into a hidden feasibility bound.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Outside-source-sample is a reporting outcome rather than target clamping or refusal of an otherwise reachable person.
 * @evidence contracts/common.md#meaningful-documentation Properties state the changed body channel, instrument-specific reading, omitted-stage limitation for stature and target membership in the observed range.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The solved measurement document and population report specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the solved measurement document and population report; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The solved measurement document and population report acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonMeasuredChannelSolution {
  /** The person with the solved body channel; everything else unchanged. */
  document: IAutoMovieHumanPersonDocument;

  /** The solved rest-instrument reading; girth uses the full evaluator and stature the compiled rest-skin reader. */
  reading: IAutoMovieHumanPersonMeasurementReading;

  /** Whether the target lies within the range the measurement's source sample observed. */
  population: "within-source-sample" | "outside-source-sample";
}
