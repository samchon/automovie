import type { IHumanCaptureCameraPose } from "@automovie/viewer/human/common/observation/IHumanCaptureCameraPose";
import { admitHumanCaptureCameraPose } from "@automovie/viewer/human/common/observation/admitHumanCaptureCameraPose";

/**
 * A measured pose file's camera for one subject as the address's `look` text.
 *
 * The pose file maps a subject id to a measured yaw and pitch and optionally a
 * distance, target and vertical field; the review's historical defaults fill
 * an absent one (0.62 m from (0, 0, 0.06) with a 28 degree field), exactly as
 * the capture runners do. The pose is admitted by the same validator, so a
 * missing subject or a non-finite value refuses instead of falling back to the
 * front view. Pure.
 *
 * @evidence contracts/common.md#principled-implementation Shared pose admission checks the selected subject before its measured values and documented legacy camera defaults form one look address.
 * @evidence contracts/common.md#clear-and-simple-design One serialization adapter follows the common camera-pose owner instead of duplicating its admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses admitted supplied measurements and established defaults without fitting a photograph or substituting a front view for a refused pose.
 * @evidence contracts/common.md#meaningful-documentation States yaw/pitch, metre-valued distance and target, vertical field defaults and the refusal instead of camera fallback.
 */
export function resolveHumanViewerPose(
  poses: Record<string, IHumanCaptureCameraPose | null>,
  subject: string,
): string {
  const pose = admitHumanCaptureCameraPose(poses, subject);
  const target = pose.target ?? [0, 0, 0.06];
  return [
    pose.yaw,
    pose.pitch,
    pose.distance ?? 0.62,
    ...target,
    pose.fov ?? 28,
  ].join(",");
}
