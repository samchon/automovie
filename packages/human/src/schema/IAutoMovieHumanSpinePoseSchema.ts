import type { IAutoMovieHumanSpinePose } from "@automovie/interface";

import type { IAutoMovieHumanLumbarPoseSchema } from "./IAutoMovieHumanLumbarPoseSchema";
import type { IAutoMovieHumanThoracicPoseSchema } from "./IAutoMovieHumanThoracicPoseSchema";

/** Typia admission/schema metadata for IAutoMovieHumanSpinePose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanSpinePoseSchema = IAutoMovieHumanSpinePose & {
  /** T1 to T12. */
  thoracic?: IAutoMovieHumanThoracicPoseSchema;

  /** L1 to S1. */
  lumbar?: IAutoMovieHumanLumbarPoseSchema;
};
