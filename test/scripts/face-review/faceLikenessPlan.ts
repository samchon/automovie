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
 * population slope when no subject calibrated its own. Pitch is
 * planned the same way by `planFaceLikenessPitches`, from a render at a known
 * pitch; a subject without one keeps a level camera.
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

/** One subject's detector-calibrated camera pitch, or null without its renders. */
export interface IFaceLikenessPitchRow {
  subject: string;
  pitch: number | null;
}

/**
 * Plan each subject's camera pitch as `planFaceLikenessYaws` plans its yaw:
 * the photograph's rotation about the horizontal axis relative to the
 * subject's frontal render (the rotation vector's x component), scaled by
 * `knownPitch` over the same component of a render at that known pitch
 * (`high`), so the detector's own response sets the scale and its sign
 * convention. Without the photograph, the frontal render or the pitched
 * render, or with a pitched response too small to divide by, the pitch is
 * null and the caller keeps its camera level.
 */
export function planFaceLikenessPitches(
  inputs: readonly {
    subject: string;
    photo: number[][] | null;
    front: number[][] | null;
    high: number[][] | null;
  }[],
  knownPitch = 20,
): IFaceLikenessPitchRow[] {
  return inputs.map((input) => {
    if (input.photo === null || input.front === null || input.high === null)
      return { subject: input.subject, pitch: null };
    const reference = faceLikenessRotationVector(
      faceLikenessRelativeRotation(input.photo, input.front),
    );
    const high = faceLikenessRotationVector(
      faceLikenessRelativeRotation(input.high, input.front),
    );
    return {
      subject: input.subject,
      pitch: faceLikenessCalibratedYaw(reference[0], high[0], knownPitch),
    };
  });
}
