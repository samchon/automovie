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
 * opening, protrusion past the upper incisor against the maximum protrusion,
 * and lateral excursion toward the face's left or right against that side's
 * maximum. A supplied maximum whose reading is unavailable cannot be checked
 * and refuses by name rather than passing unchecked. Nothing is clamped.
 *
 * @evidence contracts/common.md#principled-implementation Capacity and performance are compared on the same build's final incisal offset in the contact frame.
 * @evidence contracts/common.md#clear-and-simple-design Four comparisons, one per declared jaw maximum.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An exceeding pose refuses with both values; an uncheckable maximum refuses; nothing is clamped.
 * @evidence contracts/common.md#meaningful-documentation States each pairing, the tolerance and the unavailable case.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The check names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The check moves no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The check emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the contact frame; the tolerance is half the 0.1 mm readout.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The check builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor shows the readings.
 * @evidence contracts/anatomy.md#anatomical-source Maximum interincisal opening, protrusion and lateral excursion follow their clinical incisal definitions, which the readings measure.
 * @evidence contracts/anatomy.md#permitted-range The document's own observed capacity bounds its performance; beyond it the document refuses.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The check admits no input of its own.
 * @author Samchon
 */
export function assertHumanFaceJawCapacity(
  readings: readonly AutoMovieHumanFaceMeasurementReading[],
  request: IAutoMovieHumanFaceAnatomicalRequest | undefined,
): void {
  const jaw = request?.observations?.motionCapacity?.jaw;
  if (jaw === undefined) return;
  const read = (measurement: string, label: string): number => {
    const reading = readings.find((candidate) => candidate.measurement === measurement);
    if (reading === undefined || reading.status !== "measured")
      throw new Error(
        `The ${label} capacity cannot be checked: ${reading?.status === "unavailable" ? reading.reason : "no reading"}.`,
      );
    return reading.measured;
  };
  const check = (maximum: number | undefined, measurement: string, sign: number, label: string): void => {
    if (maximum === undefined) return;
    const performed = sign * read(measurement, label);
    if (performed > maximum + HALF_READOUT_MM)
      throw new Error(
        `The pose reaches ${performed} mm of ${label}, beyond the observed maximum ${maximum} mm.`,
      );
  };
  check(jaw.maximumInterincisalOpeningMm, "jaw.interincisalOpening", 1, "interincisal opening");
  check(jaw.maximumProtrusionMm, "jaw.protrusionBeyondOverjet", 1, "protrusion");
  check(jaw.maximumLeftExcursionMm, "jaw.lateralExcursion", 1, "left excursion");
  check(jaw.maximumRightExcursionMm, "jaw.lateralExcursion", -1, "right excursion");
}
