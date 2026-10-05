import type { IAutoMovieHumanFaceMeasurementMeasured } from "./IAutoMovieHumanFaceMeasurementMeasured";
import type { IAutoMovieHumanFaceMeasurementUnavailable } from "./IAutoMovieHumanFaceMeasurementUnavailable";

/**
 * One build's reading of a registered face measurement: a value on the final
 * surface, or a named gap.
 *
 * @evidence contracts/common.md#principled-implementation Every registered measurement is either read on the final surface or reported missing with its reason.
 * @evidence contracts/common.md#clear-and-simple-design A two-member union discriminated by status.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No third, estimated state exists.
 * @evidence contracts/common.md#meaningful-documentation States both outcomes.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A reading names a measurement, not a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels A reading is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A reading emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The members state their units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries A reading builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor shows the readings.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The registered measurement states its protocol.
 * @evidenceExclude contracts/anatomy.md#permitted-range A reading bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority A reading is output, not input.
 * @author Samchon
 */
export type AutoMovieHumanFaceMeasurementReading =
  | IAutoMovieHumanFaceMeasurementMeasured
  | IAutoMovieHumanFaceMeasurementUnavailable;
