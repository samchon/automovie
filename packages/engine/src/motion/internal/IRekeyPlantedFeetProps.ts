import type { IAutoMovieRekeyPlantedFeet } from "@automovie/interface";

import { AutoMovieEngineKinematics } from "../../kinematics/AutoMovieEngineKinematics";
import type { prepareSkeletonPoseResolution } from "../../kinematics/internal/prepareSkeletonPoseResolution";

/*
 * The re-keying props with the optional shared FK reader and prepared rig.
 */
export interface IRekeyPlantedFeetProps extends IAutoMovieRekeyPlantedFeet.IProps {
  /*
   * Optional same-operation exact FK reader shared with stance detection.
   */
  resolution?: ReturnType<typeof AutoMovieEngineKinematics.preparePoseResolution>;

  /*
   * Optional immutable snapshot of this exact rig/topology/clinical tables.
   */
  poseResolution?: prepareSkeletonPoseResolution.IRig;
}
