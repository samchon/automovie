import type { AutoMovieHumanFaceMeasurementReading } from "../../structures/AutoMovieHumanFaceMeasurementReading";
import type { IAutoMovieHumanFaceAnatomicalRequest } from "../../structures/IAutoMovieHumanFaceAnatomicalRequest";

/** Half the editor's 0.1 mm readout interval, absorbing Float32 rounding. */
const HALF_READOUT_MM = 0.05;

/**
 * Refuse a posed document whose incisal motion exceeds its own observed jaw
 * capacity.
 *
 * The document's `motionCapacity.jaw` maxima are compared with its readings
 * on the same final surface: interincisal opening against the maximum
 * opening, reference-relative protrusion against the maximum protrusion,
 * and reference-relative lateral excursion toward the face's left or right
 * against that side's maximum. Initial overjet and midline deviation are
 * accounted for by the shared excursion reader, not ignored as if the reference
 * were zero. A supplied maximum whose reading is unavailable cannot be checked
 * and refuses by name rather than passing unchecked. Nothing is clamped.
 *
 * @author Samchon
 */
export function assertHumanFaceJawCapacity(
  readings: readonly AutoMovieHumanFaceMeasurementReading[],
  request: IAutoMovieHumanFaceAnatomicalRequest | undefined,
): void {
  const jaw = request?.observations?.motionCapacity?.jaw;
  if (jaw === undefined) return;
  const read = (measurement: string, label: string): number => {
    const reading = readings.find(
      (candidate) => candidate.measurement === measurement,
    );
    if (reading === undefined || reading.status !== "measured")
      throw new Error(
        `The ${label} capacity cannot be checked: ${reading?.status === "unavailable" ? reading.reason : "no reading"}.`,
      );
    return reading.measured;
  };
  const check = (
    maximum: number | undefined,
    measurement: string,
    sign: number,
    label: string,
  ): void => {
    if (maximum === undefined) return;
    const performed = sign * read(measurement, label);
    if (performed > maximum + HALF_READOUT_MM)
      throw new Error(
        `The pose reaches ${performed} mm of ${label}, beyond the observed maximum ${maximum} mm.`,
      );
  };
  check(
    jaw.maximumInterincisalOpeningMm,
    "jaw.interincisalOpening",
    1,
    "interincisal opening",
  );
  check(
    jaw.maximumProtrusionMm,
    "jaw.protrusionFromReference",
    1,
    "protrusion",
  );
  check(
    jaw.maximumLeftExcursionMm,
    "jaw.lateralExcursionFromReference",
    1,
    "left excursion",
  );
  check(
    jaw.maximumRightExcursionMm,
    "jaw.lateralExcursionFromReference",
    -1,
    "right excursion",
  );
}
