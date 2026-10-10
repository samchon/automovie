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
 * @author Samchon
 */
export function readHumanFaceMeasurements(
  context: IHumanFaceMeasurementContext,
  request: IAutoMovieHumanFaceAnatomicalRequest | undefined,
): AutoMovieHumanFaceMeasurementReading[] {
  const targets = new Map(
    (request?.targets ?? []).map((target) => [
      target.measurement,
      target.value,
    ]),
  );
  return HUMAN_FACE_MEASUREMENTS.map((measurement) => {
    let value: number | IHumanFaceMeasurementGap;
    try {
      value = measurement.read(context);
      if (typeof value === "number" && !Number.isFinite(value))
        value = {
          reason: `The instrument for ${measurement.id} has no finite reading on the final surface.`,
        };
    } catch (error) {
      value = {
        reason: error instanceof Error ? error.message : String(error),
      };
    }
    return typeof value === "number"
      ? {
          status: "measured",
          measurement: measurement.id,
          unit: measurement.unit,
          requested: targets.get(measurement.id) ?? null,
          measured: value,
          ...(measurement.qualification === undefined
            ? {}
            : { qualification: measurement.qualification }),
        }
      : {
          status: "unavailable",
          measurement: measurement.id,
          reason: value.reason,
        };
  });
}
