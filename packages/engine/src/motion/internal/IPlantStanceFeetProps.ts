import type { IAutoMoviePlantStanceFeet } from "@automovie/interface";

import type { prepareSkeletonPoseResolution } from "../../kinematics/internal/prepareSkeletonPoseResolution";

/** The planting props with an optional prepared rig. */
export interface IPlantStanceFeetProps extends IAutoMoviePlantStanceFeet.IProps {
  /**
   * Explicit immutable snapshot of this exact rig and clinical tables; omitted
   * keeps full raw FK admission.
   */
  poseResolution?: prepareSkeletonPoseResolution.IRig;
}
