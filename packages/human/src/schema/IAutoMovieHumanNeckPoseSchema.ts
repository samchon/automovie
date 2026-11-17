import type { IAutoMovieHumanNeckPose } from "@automovie/interface";

import type { IAutoMovieHumanAtlantoAxialPoseSchema } from "./IAutoMovieHumanAtlantoAxialPoseSchema";
import type { IAutoMovieHumanAtlantoOccipitalPoseSchema } from "./IAutoMovieHumanAtlantoOccipitalPoseSchema";
import type { IAutoMovieHumanCervicalPoseSchema } from "./IAutoMovieHumanCervicalPoseSchema";

/** Typia admission/schema metadata for IAutoMovieHumanNeckPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanNeckPoseSchema = IAutoMovieHumanNeckPose & {
  /** Skull on C1: the nod. */
  atlantoOccipital?: IAutoMovieHumanAtlantoOccipitalPoseSchema;

  /** C1 on C2: head rotation. */
  atlantoAxial?: IAutoMovieHumanAtlantoAxialPoseSchema;

  /** C2 to C7. */
  cervical?: IAutoMovieHumanCervicalPoseSchema;
};
