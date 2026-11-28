import type {
  IAutoMovieHumanPair,
  IAutoMovieHumanPose,
} from "@automovie/interface";

import type { IAutoMovieHumanArmPoseSchema } from "./IAutoMovieHumanArmPoseSchema";
import type { IAutoMovieHumanHeadPoseSchema } from "./IAutoMovieHumanHeadPoseSchema";
import type { IAutoMovieHumanLegPoseSchema } from "./IAutoMovieHumanLegPoseSchema";
import type { IAutoMovieHumanNeckPoseSchema } from "./IAutoMovieHumanNeckPoseSchema";
import type { IAutoMovieHumanPelvisPoseSchema } from "./IAutoMovieHumanPelvisPoseSchema";
import type { IAutoMovieHumanSpinePoseSchema } from "./IAutoMovieHumanSpinePoseSchema";

/**
 * One Human pose for typia validation, expressed in clinical degrees from
 * anatomical neutral and millimetres for jaw travel. Each region is optional.
 * A supplied arm or leg record contains both anatomical sides.
 */
export type IAutoMovieHumanPoseSchema = IAutoMovieHumanPose & {
  /** Eyes and jaw. */
  head?: IAutoMovieHumanHeadPoseSchema;

  /** Cranio-vertebral joints and the lower cervical spine. */
  neck?: IAutoMovieHumanNeckPoseSchema;

  /** Shoulder girdle, arm and hand of each side. */
  arms?: IAutoMovieHumanPair<IAutoMovieHumanArmPoseSchema>;

  /** Thoracic and lumbar spine. */
  spine?: IAutoMovieHumanSpinePoseSchema;

  /** Orientation of the pelvis, the root of the body. */
  pelvis?: IAutoMovieHumanPelvisPoseSchema;

  /** Hip, knee, ankle, foot and toes of each side. */
  legs?: IAutoMovieHumanPair<IAutoMovieHumanLegPoseSchema>;
};
