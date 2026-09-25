import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";
import { humanBodyShoulderElevationLimit } from "./humanBodyShoulderElevationLimit";

type Shoulder = NonNullable<
  IAutoMovieHumanBodyBasis["joints"][number]["shoulder"]
>;

/**
 * Whether `pose` lies inside the basis's clinical reach for its humerus: the
 * total elevation and axial rotation ranges, then the joint-sinus maximum of
 * its plane, with the overhead pole judged by direction rather than by the
 * plane the author happened to write (see `humanBodyShoulderElevationLimit`).
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Admits a shoulder goal only inside the clinical reach of its direction and refuses the rest instead of clamping it.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Applies the elevation and axial ranges, the plane envelope and the pole rule that the builder, basis admission and editor share.
 */
export function humanBodyShoulderReaches(
  shoulder: Pick<Shoulder, "range">,
  pose: Pick<
    IAutoMovieHumanBodyShoulderPose,
    "plane" | "elevation" | "axialRotation"
  >,
): boolean {
  const range = shoulder.range;
  if (
    !Number.isFinite(pose.plane) ||
    !Number.isFinite(pose.elevation) ||
    !Number.isFinite(pose.axialRotation) ||
    pose.elevation < range.elevation.min ||
    pose.elevation > range.elevation.max ||
    pose.axialRotation < range.axialRotation.min ||
    pose.axialRotation > range.axialRotation.max
  )
    return false;
  if (pose.elevation === 180)
    return range.envelope.some(([, limit]) => limit >= 180);
  return pose.elevation <= humanBodyShoulderElevationLimit(range, pose.plane);
}
