import {
  type IPortraitWebPose,
  portraitWebCapturePose,
} from "../face-review/web/portraitWebCapturePose";

/**
 * A measured pose file's camera for one subject as the address's `look` text.
 *
 * The pose file maps a subject id to a measured yaw and pitch and optionally a
 * distance, target and vertical field; the review's historical defaults fill
 * an absent one (0.62 m from (0, 0, 0.06) with a 28 degree field), exactly as
 * the capture runners do. The pose is admitted by the same validator, so a
 * missing subject or a non-finite value refuses instead of falling back to the
 * front view. Pure.
 */
export function resolveHumanViewerPose(
  poses: Record<string, IPortraitWebPose | null>,
  subject: string,
): string {
  const pose = portraitWebCapturePose(poses, subject, false);
  const target = pose.target ?? [0, 0, 0.06];
  return [
    pose.yaw,
    pose.pitch,
    pose.distance ?? 0.62,
    ...target,
    pose.fov ?? 28,
  ].join(",");
}
