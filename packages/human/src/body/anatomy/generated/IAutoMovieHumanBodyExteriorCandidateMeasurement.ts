import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";
import type { IAutoMovieHumanBodyExteriorCandidateSection } from "./IAutoMovieHumanBodyExteriorCandidateSection";

/**
 * Requested and achieved readings of one bound surface target. All lengths are metres; final and Float32 output share the same instrument.
 *
 * @evidence contracts/common.md#principled-implementation One bound target retains canonical path, instrument/protocol, requested metres and actual final/Float32 readings with signed residual.
 * @evidence contracts/common.md#clear-and-simple-design Readback and optional cutting witness accompany each consumed target instead of forming another simple-tier request.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Float32 residual never substitutes an intended value for measured emission, and protocol departures remain explicit.
 * @evidence contracts/common.md#meaningful-documentation Members define metre units, side omission, source instrument, residual sign/tolerance and absent section meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A fulfilled-reading record performs no measurement inversion or Float32 conversion algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Final/readback values are output witnesses without cross-request measurement caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar readings and section provenance own no skin buffers or running instrument.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorCandidateMeasurement {
  /** Canonical document path of the consumed bound target, such as `anatomy.surface.leftUpperLimb.hand.length`. The exterior builder preserves this identity beside the anatomical part report; no separate simple-tier request is lifted by this carrier. */
  readonly path: string;

  /** Key of the instrument in `HUMAN_BODY_MEASUREMENTS`. */
  readonly rule: string;

  /** Side the rule was oriented to; omitted for a midline or bilateral rule. */
  readonly side?: AutoMovieHumanBodySide;

  /** How the source-rest instrument departs from the cited survey definition. */
  readonly protocol: string;

  /** Absolute value the request asked for, copied from its non-observed target. */
  readonly targetMetres: number;

  /** The instrument on the final double-precision skin, before Float32 quantization. */
  readonly finalMetres: number;

  /** The same instrument on the skin after the Float32 mesh-buffer boundary that export and preview consume. */
  readonly float32Metres: number;

  /** `float32Metres - targetMetres`: positive when the emitted value exceeds the request. The builder refuses a result whose magnitude exceeds half the inverse's 0.1 mm readout (0.05 mm). */
  readonly residualMetres: number;

  /** The cut the Float32 reading measured, for readback by consumers, or null for an instrument that reads no section (a distance or a skin extent). */
  readonly section: IAutoMovieHumanBodyExteriorCandidateSection | null;
}
