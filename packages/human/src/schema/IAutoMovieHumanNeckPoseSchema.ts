import type { IAutoMovieHumanNeckPose } from "@automovie/interface";

import type { IAutoMovieHumanAtlantoAxialPoseSchema } from "./IAutoMovieHumanAtlantoAxialPoseSchema";
import type { IAutoMovieHumanAtlantoOccipitalPoseSchema } from "./IAutoMovieHumanAtlantoOccipitalPoseSchema";
import type { IAutoMovieHumanCervicalPoseSchema } from "./IAutoMovieHumanCervicalPoseSchema";

/**
 * Optional neck and head joint offsets for typia validation, in degrees from
 * anatomical neutral. Specify skull-to-atlas nod and tilt, atlas rotation or
 * lower cervical motion independently.
 */
export type IAutoMovieHumanNeckPoseSchema = IAutoMovieHumanNeckPose & {
  /** Skull on C1: the nod. */
  atlantoOccipital?: IAutoMovieHumanAtlantoOccipitalPoseSchema;

  /** C1 on C2: head rotation. */
  atlantoAxial?: IAutoMovieHumanAtlantoAxialPoseSchema;

  /** C2 to C7. */
  cervical?: IAutoMovieHumanCervicalPoseSchema;
};
