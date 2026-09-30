/** A measured capture camera: angles in degrees, distance and target in metres. */
export interface IPortraitWebPose {
  yaw: number;
  pitch: number;
  distance?: number;
  target?: [number, number, number];
  /** Vertical field of view in degrees; the review's historical 28 when absent. */
  fov?: number;
}

/**
 * Use an externally measured view without silently inventing a missing pose.
 *
 * The pose map names a camera per model id (`plan-face-likeness.ts`). A
 * missing map or model, a non-finite or out-of-range angle (yaw within 180,
 * pitch below 90 degrees), a non-positive distance, a target that is not three
 * finite numbers and a field outside (0, 180) degrees each refuse, because a
 * fallback to the front camera would label a wrong view as the matched one.
 * The result carries the same camera for the colour and the hair ID pass and
 * copies the target, so the caller's pose stays its own. Pure.
 */
export function portraitWebCapturePose(
  poses: Record<string, IPortraitWebPose | null> | null,
  id: string,
  hairMask: boolean,
): IPortraitWebPose & { hairMask: boolean } {
  const pose = poses?.[id];
  if (
    pose === undefined ||
    pose === null ||
    !Number.isFinite(pose.yaw) ||
    !Number.isFinite(pose.pitch) ||
    Math.abs(pose.yaw) > 180 ||
    Math.abs(pose.pitch) >= 90 ||
    (pose.distance !== undefined &&
      (!Number.isFinite(pose.distance) || pose.distance <= 0)) ||
    (pose.target !== undefined &&
      (pose.target.length !== 3 ||
        pose.target.some((value) => !Number.isFinite(value)))) ||
    (pose.fov !== undefined &&
      (!Number.isFinite(pose.fov) || pose.fov <= 0 || pose.fov >= 180))
  )
    throw new Error(
      "A matched face view needs a finite measured camera pose and frame.",
    );
  return {
    yaw: pose.yaw,
    pitch: pose.pitch,
    hairMask,
    ...(pose.distance === undefined ? {} : { distance: pose.distance }),
    ...(pose.target === undefined ? {} : { target: [...pose.target] }),
    ...(pose.fov === undefined ? {} : { fov: pose.fov }),
  };
}
