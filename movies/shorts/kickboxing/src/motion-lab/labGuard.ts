import type { IAutoMovieHumanPose } from "@automovie/human";

import { inspectionGuard } from "../inspectionGuard";

/**
 * Mirror the authored guard's lead-side roles without changing body proportions.
 *
 * @evidence contracts/common.md#implementation-and-ownership The geometry-only seed starts left lead. Right lead exchanges bilateral arm/leg controls and reverses central axial/lateral controls; own-side joint angles retain their public anatomical meanings. Public fitting still establishes actual head/hand/foot placement.
 * @evidence contracts/common.md#authoring-interface Lead is anatomical and independent of world heading. Returns an owned clinical seed, not a support or balance certificate.
 */
export function labGuard(lead: "left" | "right"): IAutoMovieHumanPose {
  const pose: IAutoMovieHumanPose = inspectionGuard();
  if (lead === "left") return pose;
  if (pose.arms) pose.arms = { left: pose.arms.right, right: pose.arms.left };
  if (pose.legs) pose.legs = { left: pose.legs.right, right: pose.legs.left };
  if (pose.pelvis?.rotation !== undefined) pose.pelvis.rotation *= -1;
  for (const region of [pose.spine?.thoracic, pose.spine?.lumbar]) {
    if (region?.rotation !== undefined) region.rotation *= -1;
    if (region?.lateralFlexion !== undefined) region.lateralFlexion *= -1;
  }
  return pose;
}
