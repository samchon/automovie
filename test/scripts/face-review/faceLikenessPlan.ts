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

/** One subject's camera pose after one refinement step, or unchanged. */
export interface IFaceLikenessPoseRefinement {
  subject: string;
  yaw: number;
  pitch: number;
  /** The residual read on the render at the previous pose, degrees. */
  residual: { yaw: number; pitch: number } | null;
  /** The residual lay beyond the calibrated angles and was not applied. */
  held?: true;
}

/**
 * Refine each subject's planned camera pose by the residual the detector
 * reads between its photograph and the render taken at that pose.
 *
 * A calibrated estimate from the subject's frontal render is exact only when
 * the detector reads the render and the photograph alike; a face whose own
 * shape tilts the detector's reading leaves a residual the render at the
 * planned pose shows. Reading the photograph against that render the way the
 * plan read it against the frontal one (the rotation vector's y component
 * for yaw and x for pitch), scaled by the same calibration renders' response
 * to a known 45 degree yaw and 20 degree pitch, gives the correction, and the
 * pose moves by it: one step of a fixed-point iteration whose fixed point is
 * the camera under which the detector reads the render as it reads the
 * photograph. A residual beyond the calibrated angles would extrapolate the
 * detector's response, so that pose is held and the row says so. A subject
 * whose quarter or raised calibration render was not
 * detected takes the population median response, as the plan does; one whose
 * photograph or render was not detected, or whose scale is unavailable, keeps
 * its pose and reports no residual.
 *
 * Pure: reads caller-owned matrices and returns new rows.
 */
export function refineFaceLikenessPoses(
  inputs: readonly {
    subject: string;
    pose: { yaw: number; pitch: number };
    photo: number[][] | null;
    render: number[][] | null;
    front: number[][] | null;
    quarter: number[][] | null;
    high: number[][] | null;
  }[],
  known = { yaw: 45, pitch: 20 },
): IFaceLikenessPoseRefinement[] {
  // Degrees per radian of detector response, the subject's own or null.
  const slope = (
    front: number[][] | null,
    calibration: number[][] | null,
    axis: 0 | 1,
    degrees: number,
  ): number | null => {
    if (front === null || calibration === null) return null;
    const response = faceLikenessRotationVector(
      faceLikenessRelativeRotation(calibration, front),
    )[axis];
    return Math.abs(response) < 1e-6 ? null : degrees / response;
  };
  const own = inputs.map((input) => ({
    yaw: slope(input.front, input.quarter, 1, known.yaw),
    pitch: slope(input.front, input.high, 0, known.pitch),
  }));
  const median = {
    yaw: faceLikenessMedian(
      own.flatMap((one) => (one.yaw === null ? [] : [one.yaw])),
    ),
    pitch: faceLikenessMedian(
      own.flatMap((one) => (one.pitch === null ? [] : [one.pitch])),
    ),
  };
  return inputs.map((input, k) => {
    const yawSlope = own[k]!.yaw ?? median.yaw;
    const pitchSlope = own[k]!.pitch ?? median.pitch;
    if (
      input.photo === null ||
      input.render === null ||
      yawSlope === null ||
      pitchSlope === null
    )
      return {
        subject: input.subject,
        yaw: input.pose.yaw,
        pitch: input.pose.pitch,
        residual: null,
      };
    const residual = faceLikenessRotationVector(
      faceLikenessRelativeRotation(input.photo, input.render),
    );
    const yaw = residual[1] * yawSlope;
    const pitch = residual[0] * pitchSlope;
    // The calibration renders span the known angles; a residual beyond them
    // extrapolates the detector's response, so the pose stays and says so.
    if (Math.abs(yaw) > known.yaw || Math.abs(pitch) > known.pitch)
      return {
        subject: input.subject,
        yaw: input.pose.yaw,
        pitch: input.pose.pitch,
        residual: { yaw, pitch },
        held: true,
      };
    return {
      subject: input.subject,
      yaw: input.pose.yaw + yaw,
      pitch: input.pose.pitch + pitch,
      residual: { yaw, pitch },
    };
  });
}
