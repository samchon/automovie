import type { IAutoMovieHumanSectionPlane } from "../../common/measure/IAutoMovieHumanSectionPlane";
import type { IAutoMovieHumanSectionReading } from "../../common/measure/IAutoMovieHumanSectionReading";

/**
 * One person instrument reading: a metre value and, for girth, its closed section and cutting plane. Girth uses a full person build; stature can use the compiled rest-skin reader without full contact and closure stages.
 *
 * @evidence contracts/common.md#principled-implementation A metre reading optionally carries the actual section and plane for girth, while stature has no section operands.
 * @evidence contracts/common.md#clear-and-simple-design The shared scalar result supports both instruments without forcing stature to fabricate a contour.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional section metadata reflects the chosen instrument, not a substitute synthetic loop when a girth fails to close.
 * @evidence contracts/common.md#meaningful-documentation Members state metre units and that section and plane are absent for stature.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The instrument readout and optional girth section metadata specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the instrument readout and optional girth section metadata; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The instrument readout and optional girth section metadata acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonMeasurementReading {
  /** The measured value, metres. */
  metres: number;

  /** The closed section loop a girth was read from; absent for stature. */
  section?: IAutoMovieHumanSectionReading;

  /** The plane that cut the skin for a girth; absent for stature. */
  plane?: IAutoMovieHumanSectionPlane;
}
