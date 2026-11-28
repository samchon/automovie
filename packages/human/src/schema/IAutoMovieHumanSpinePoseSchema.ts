import type { IAutoMovieHumanSpinePose } from "@automovie/interface";

import type { IAutoMovieHumanLumbarPoseSchema } from "./IAutoMovieHumanLumbarPoseSchema";
import type { IAutoMovieHumanThoracicPoseSchema } from "./IAutoMovieHumanThoracicPoseSchema";

/**
 * Thoracic and lumbar joint offsets for typia validation, in clinical degrees
 * from anatomical neutral. The two spinal regions are independently optional.
 */
export type IAutoMovieHumanSpinePoseSchema = IAutoMovieHumanSpinePose & {
  /** T1 to T12. */
  thoracic?: IAutoMovieHumanThoracicPoseSchema;

  /** L1 to S1. */
  lumbar?: IAutoMovieHumanLumbarPoseSchema;
};
