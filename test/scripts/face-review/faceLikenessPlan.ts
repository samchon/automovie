/**
 * Population rule for the reference camera yaw of each subject.
 *
 * `plan-face-likeness.ts yaw` calls `planFaceLikenessYaws` with the detector
 * transforms of each subject's photograph, frontal render and 45 degree
 * left-quarter render of the same published document. The yaw of a subject
 * is its own detector-calibrated estimate (see
 * `faceLikenessCalibratedYaw`). When the subject's quarter render is not
 * detected, the population median calibration slope is used instead and the
 * row says so; when the photograph or the frontal render is not detected, no
 * yaw exists and the row stays missing, as does a subject needing the
 * population slope when no subject calibrated its own. Pitch is not
 * estimated: every planned camera has pitch 0 and the receipt records that
 * limit.
 *
 * Pure: reads caller-owned matrices and returns new rows.
 */
import {
  faceLikenessCalibratedYaw,
  faceLikenessMedian,
  faceLikenessRelativeRotation,
  faceLikenessRotationVector,
} from "./faceLikenessGeometry";

/** Detector transforms of one subject; null means not detected. */
export interface IFaceLikenessYawInput {
  subject: string;
  photo: number[][] | null;
  front: number[][] | null;
  quarter: number[][] | null;
}

/** One planned yaw and how it was obtained. */
export interface IFaceLikenessYawRow {
  subject: string;
  status:
    | "measured"
    | "population-calibrated"
    | "calibration-unavailable"
    | "face-undetected";
  referenceRelativeRotationVector: [number, number, number] | null;
  quarterRelativeRotationVector: [number, number, number] | null;
  yaw: number | null;
}

/** Plan each subject's camera yaw under one population rule. */
export function planFaceLikenessYaws(
  inputs: readonly IFaceLikenessYawInput[],
  knownYaw = 45,
): { medianDegreesPerRadian: number | null; rows: IFaceLikenessYawRow[] } {
  const rows: IFaceLikenessYawRow[] = inputs.map((input) => {
    if (input.photo === null || input.front === null)
      return {
        subject: input.subject,
        status: "face-undetected",
        referenceRelativeRotationVector: null,
        quarterRelativeRotationVector: null,
        yaw: null,
      };
    const reference = faceLikenessRotationVector(
      faceLikenessRelativeRotation(input.photo, input.front),
    );
    const quarter =
      input.quarter === null
        ? null
        : faceLikenessRotationVector(
            faceLikenessRelativeRotation(input.quarter, input.front),
          );
    const yaw =
      quarter === null
        ? null
        : faceLikenessCalibratedYaw(reference[1], quarter[1], knownYaw);
    return {
      subject: input.subject,
      status: yaw === null ? "population-calibrated" : "measured",
      referenceRelativeRotationVector: reference,
      quarterRelativeRotationVector: quarter,
      yaw,
    };
  });
  const slope = faceLikenessMedian(
    rows
      .filter((row) => row.status === "measured")
      .map((row) => knownYaw / row.quarterRelativeRotationVector![1]),
  );
  for (const row of rows)
    if (row.status === "population-calibrated")
      if (slope === null) row.status = "calibration-unavailable";
      else row.yaw = row.referenceRelativeRotationVector![1] * slope;
  return { medianDegreesPerRadian: slope, rows };
}
