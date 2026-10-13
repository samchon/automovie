import type { IAutoMovieHumanFaceMeasurementTarget as ImportedIAutoMovieHumanFaceMeasurementTarget, IHumanFaceMeasurement as ImportedIHumanFaceMeasurement } from "@automovie/human";
import type { AutoMovieHumanFaceMeasurementReading } from "../../structures/AutoMovieHumanFaceMeasurementReading";
import type { IAutoMovieHumanFaceAnatomicalRequest } from "../../structures/IAutoMovieHumanFaceAnatomicalRequest";
import { HUMAN_FACE_MEASUREMENTS } from "./HUMAN_FACE_MEASUREMENTS";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * Read every registered face measurement on one build's final surface.
 *
 * Each reading is in registry order, carries the document's target for it or null, and is either the measured value or the gap the basis leaves, so a caller sees every measurement and its residual in one list. A target never replaces a reading. A registry qualification travels with the value, so the actual editor can distinguish a source-conditioned observable from an unregistered clinical quantity without consulting source comments. Each instrument's refusal or non-finite result becomes that measurement's unavailable reason; other readable quantities remain observable.
 *
 * @evidence contracts/common.md#principled-implementation Registry order drives actual geometry reads and preserves each instrument's unit and qualification.
 * @evidence contracts/common.md#clear-and-simple-design Requested values remain separate report context rather than replacing measured values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Thrown callbacks and nonfinite readings become named unavailable results; report success is not clinical or rendered-output proof.
 * @evidence contracts/common.md#meaningful-documentation Each entry distinguishes measured geometry, unavailable reason and optional requested value.
 * @evidence contracts/performance.md#efficient-algorithms Work sums all registered instrument costs plus requested-target map construction.
 * @evidence contracts/performance.md#reuse-equivalent-work One registry/context is shared across readers, but individual mesh extraction is currently not memoized.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned report records are owned and temporary request lookup is released without retaining trial geometry.
 *
 * @author Samchon
 */
export function readHumanFaceMeasurements(
  context: IHumanFaceMeasurementContext,
  request: IAutoMovieHumanFaceAnatomicalRequest | undefined,
): AutoMovieHumanFaceMeasurementReading[] {
  const targets: Map<string, number> = new Map(
    (request?.targets ?? []).map((target: ImportedIAutoMovieHumanFaceMeasurementTarget): [string, number] => [
      target.measurement,
      target.value,
    ]),
  );
  return HUMAN_FACE_MEASUREMENTS.map((measurement: ImportedIHumanFaceMeasurement): { qualification?: string | undefined; status: "measured"; measurement: string; unit: "count" | "degrees" | "millimetres" | "square-millimetres" | "cubic-centimetres"; requested: number | null; measured: number; reason?: undefined; } | { status: "unavailable"; measurement: string; reason: string; } => {
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
