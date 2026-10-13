import type { IHumanCaptureCameraPose } from "./IHumanCaptureCameraPose.js";

/**
 * Admit one recorded camera without substituting a different viewing direction.
 * Yaw is within 180 degrees and pitch below 90 degrees in magnitude. Optional
 * distance is positive, the target contains three finite metre coordinates,
 * and vertical field of view is strictly between zero and 180 degrees.
 * The returned target is copied so framing cannot mutate the source record.
 */
export function admitHumanCaptureCameraPose(
  poses: Record<string, IHumanCaptureCameraPose | null> | null,
  id: string,
): IHumanCaptureCameraPose {
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
    ...(pose.distance === undefined ? {} : { distance: pose.distance }),
    ...(pose.target === undefined ? {} : { target: [...pose.target] }),
    ...(pose.fov === undefined ? {} : { fov: pose.fov }),
  };
}
