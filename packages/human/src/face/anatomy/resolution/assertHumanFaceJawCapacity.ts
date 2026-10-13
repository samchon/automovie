import type { IAutoMovieHumanFaceMotionCapacityParameters as ImportedIAutoMovieHumanFaceMotionCapacityParameters, IAutoMovieHumanFaceMeasurementMeasured as ImportedIAutoMovieHumanFaceMeasurementMeasured, IAutoMovieHumanFaceMeasurementUnavailable as ImportedIAutoMovieHumanFaceMeasurementUnavailable } from "@automovie/human";
import type { AutoMovieHumanFaceMeasurementReading } from "../../structures/AutoMovieHumanFaceMeasurementReading";
import type { IAutoMovieHumanFaceAnatomicalRequest } from "../../structures/IAutoMovieHumanFaceAnatomicalRequest";

/** Half the editor's 0.1 mm readout interval, absorbing Float32 rounding. */
const HALF_READOUT_MM: number = 0.05;

/**
 * Refuse a posed document whose incisal motion exceeds its own observed jaw capacity.
 *
 * The document's `motionCapacity.jaw` maxima are compared with its readings on the same final surface: interincisal opening against the maximum opening, reference-relative protrusion against the maximum protrusion, and reference-relative lateral excursion toward the face's left or right against that side's maximum. Initial overjet and midline deviation are accounted for by the shared excursion reader, not ignored as if the reference were zero. A supplied maximum whose reading is unavailable cannot be checked and refuses by name rather than passing unchecked. Nothing is clamped.
 *
 * @evidence contracts/common.md#principled-implementation Available final incisal readings compare with the document's own signed opening/protrusion/lateral maxima.
 * @evidence contracts/common.md#clear-and-simple-design Reference-relative excursion accounts for initial overjet and dental-midline offset through the shared reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing required readings refuse; the 0.05-mm allowance is half the editor readout, not clinical safety tolerance or universal jaw limits.
 * @evidence contracts/common.md#meaningful-documentation Maxima/readings are millimetres and right excursion reverses the shared anatomical-left sign.
 * @evidence contracts/performance.md#efficient-algorithms At most four linear reading searches and fixed comparisons dominate work.
 * @evidence contracts/performance.md#reuse-equivalent-work The same final report readings are reused instead of a second posed measurement build.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No record is mutated or retained and no geometry/capacity cache is allocated.
 *
 * @author Samchon
 */
export function assertHumanFaceJawCapacity(
  readings: readonly AutoMovieHumanFaceMeasurementReading[],
  request: IAutoMovieHumanFaceAnatomicalRequest | undefined,
): void {
  const jaw: ImportedIAutoMovieHumanFaceMotionCapacityParameters.Jaw | undefined = request?.observations?.motionCapacity?.jaw;
  if (jaw === undefined) return;
  const read: (measurement: string, label: string) => number = (measurement: string, label: string): number => {
    const reading: AutoMovieHumanFaceMeasurementReading | undefined = readings.find(
      (candidate: ImportedIAutoMovieHumanFaceMeasurementMeasured | ImportedIAutoMovieHumanFaceMeasurementUnavailable): boolean => candidate.measurement === measurement,
    );
    if (reading === undefined || reading.status !== "measured")
      throw new Error(
        `The ${label} capacity cannot be checked: ${reading?.status === "unavailable" ? reading.reason : "no reading"}.`,
      );
    return reading.measured;
  };
  const check: (maximum: number | undefined, measurement: string, sign: number, label: string) => void = (
    maximum: number | undefined,
    measurement: string,
    sign: number,
    label: string,
  ): void => {
    if (maximum === undefined) return;
    const performed: number = sign * read(measurement, label);
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
