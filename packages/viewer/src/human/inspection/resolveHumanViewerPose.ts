import type { IHumanCaptureCameraPose } from "@automovie/viewer/human/common/observation/IHumanCaptureCameraPose";
import { admitHumanCaptureCameraPose } from "@automovie/viewer/human/common/observation/admitHumanCaptureCameraPose";

/**
 * A measured pose file's camera for one subject as the address's `look` text.
 *
 * The pose file maps a subject id to a measured yaw and pitch and optionally a distance, target and vertical field; the review's historical defaults fill an absent one (0.62 m from (0, 0, 0.06) with a 28 degree field), exactly as the capture runners do. The pose is admitted by the same validator, so a missing subject or a non-finite value refuses instead of falling back to the front view. Pure.
 *
 * @evidence contracts/common.md#principled-implementation Uses the shared recorded-camera validator and the capture protocol's existing optional distance, target and field-of-view defaults before serializing look values.
 * @evidence contracts/common.md#clear-and-simple-design Pose admission remains with the common observation owner and this adapter only forms the transport's numeric look field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or invalid subject poses refuse rather than falling back to an arbitrary front view; historical defaults apply only to omitted optional framing fields.
 * @evidence contracts/common.md#meaningful-documentation The comment names units, defaults, required angles and the shared admission boundary.
 * @evidence contracts/performance.md#efficient-algorithms One subject lookup and a fixed seven-value join including field of view use constant work and one small string, independent of model geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied pose map is read per call; no old camera is retained across a changed application pose file.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The map and admitted pose are borrowed and only the look string escapes; no page, camera object or file handle is acquired.
 */
export function resolveHumanViewerPose(
  poses: Record<string, IHumanCaptureCameraPose | null>,
  subject: string,
): string {
  const pose: ReturnType<typeof admitHumanCaptureCameraPose> = admitHumanCaptureCameraPose(poses, subject);
  const target: readonly [number, number, number] = pose.target ?? [0, 0, 0.06];
  return [
    pose.yaw,
    pose.pitch,
    pose.distance ?? 0.62,
    ...target,
    pose.fov ?? 28,
  ].join(",");
}
