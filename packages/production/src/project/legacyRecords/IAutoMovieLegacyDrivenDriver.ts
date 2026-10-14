import type { IAutoMovieDrivenDriver } from "@automovie/interface";
import type { IAutoMovieLegacyRange } from "./IAutoMovieLegacyRange";

/**
 * A driven driver whose tuple-valued inRange/outRange cross the v1 boundary as named {@link IAutoMovieLegacyRange} objects, converted to engine pairs by toEnginePropSpec.
 *
 * @evidence contracts/common.md#principled-implementation The stored driven variant keeps named from/to ranges while inheriting active driver fields; toEnginePropSpec lowers each present range in order to a two-element engine pair.
 * @evidence contracts/common.md#clear-and-simple-design Only the tuple representation differs; the legacy prop-driver union and converter own this historical boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent ranges remain absent, including curve-driven channels; the converter does not infer endpoints or authorize invalid ranges.
 * @evidence contracts/common.md#meaningful-documentation States named range representation, lowering owner and curve-related omission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Named endpoints run no value mapping; conversion and active driver evaluation own lowering and interpolation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A driver record defines no retained output cache for changed ranges or source channels.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Optional endpoint objects belong to the enclosing profile and retain no live solver or handle.
 * @author Samchon
 */
export interface IAutoMovieLegacyDrivenDriver extends Omit<
  IAutoMovieDrivenDriver,
  "inRange" | "outRange"
> {
  /**
   * Source value range mapped onto {@link outRange}. Omit when `curve` is set.
   */
  inRange?: IAutoMovieLegacyRange;

  /**
   * Output value range. Omit when `curve` is set.
   */
  outRange?: IAutoMovieLegacyRange;
}
