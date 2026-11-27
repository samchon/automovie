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

/** Typia admission/schema metadata for IAutoMovieHumanPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
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
