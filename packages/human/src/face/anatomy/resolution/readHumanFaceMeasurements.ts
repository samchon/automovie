import type { AutoMovieHumanFaceMeasurementReading } from "../../structures/AutoMovieHumanFaceMeasurementReading";
import type { IAutoMovieHumanFaceAnatomicalRequest } from "../../structures/IAutoMovieHumanFaceAnatomicalRequest";
import { HUMAN_FACE_MEASUREMENTS } from "./HUMAN_FACE_MEASUREMENTS";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * Read every registered face measurement on one build's final surface.
 *
 * Each reading is in registry order, carries the document's target for it or
 * null, and is either the measured value or the gap the basis leaves, so a
 * caller sees every measurement and its residual in one list. A target never
 * replaces a reading. A registry qualification travels with the value, so
 * the actual editor can distinguish a source-conditioned observable from an
 * unregistered clinical quantity without consulting source comments.
 * Each instrument's refusal or non-finite result becomes that measurement's
 * unavailable reason; other readable quantities remain observable.
 *
 * @evidence contracts/common.md#principled-implementation Requested and measured values come from the same final surface of the same build.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the registry yields one reading per measurement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A gap is reported as unavailable with its reason; no reading is substituted.
 * @evidence contracts/common.md#meaningful-documentation States order, the requested field and both reading kinds.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The readings name measurements, not parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels Reading moves no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Reading emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Each value is in its measurement's stated unit.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Reading builds no boundary.
 * @evidence contracts/modeling.md#rendered-observation The readings measure the surface the editor displays and exports.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Each registered measurement states its protocol.
 * @evidenceExclude contracts/anatomy.md#permitted-range Reading bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Readings are output, not input.
 * @author Samchon
 */
export function readHumanFaceMeasurements(
  context: IHumanFaceMeasurementContext,
  request: IAutoMovieHumanFaceAnatomicalRequest | undefined,
): AutoMovieHumanFaceMeasurementReading[] {
  const targets = new Map(
    (request?.targets ?? []).map((target) => [target.measurement, target.value]),
  );
  return HUMAN_FACE_MEASUREMENTS.map((measurement) => {
    let value: number | IHumanFaceMeasurementGap;
    try {
      value = measurement.read(context);
      if (typeof value === "number" && !Number.isFinite(value))
        value = { reason: `The instrument for ${measurement.id} has no finite reading on the final surface.` };
    } catch (error) {
      value = { reason: error instanceof Error ? error.message : String(error) };
    }
    return typeof value === "number"
      ? {
          status: "measured",
          measurement: measurement.id,
          unit: measurement.unit,
          requested: targets.get(measurement.id) ?? null,
          measured: value,
          ...(measurement.qualification === undefined ? {} : { qualification: measurement.qualification }),
        }
      : { status: "unavailable", measurement: measurement.id, reason: value.reason };
  });
}
