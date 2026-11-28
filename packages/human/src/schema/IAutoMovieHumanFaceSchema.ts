import type {
  IAutoMovieHumanFace,
  IAutoMovieHumanPair,
} from "@automovie/interface";
import type { tags } from "typia";

import type { IAutoMovieHumanEyeSchema } from "./IAutoMovieHumanEyeSchema";
import type { IAutoMovieHumanMouthSchema } from "./IAutoMovieHumanMouthSchema";
import type { IAutoMovieHumanNoseSchema } from "./IAutoMovieHumanNoseSchema";

/**
 * Resting face measurements for typia validation. Supply each eye opening
 * separately, the distance between the inner eye corners, and the nose and
 * closed-mouth dimensions. Measurements use millimetres.
 */
export type IAutoMovieHumanFaceSchema = IAutoMovieHumanFace & {
  /** Eye openings; equal values retain a shared bilateral measurement. */
  eyePair: IAutoMovieHumanPair<IAutoMovieHumanEyeSchema>;

  /** Euclidean three-dimensional distance between the two endocanthia, millimetres. */
  intercanthalWidth: number & tags.Minimum<10> & tags.Maximum<60>;

  /** Nose dimensions. */
  nose: IAutoMovieHumanNoseSchema;

  /** Closed-mouth dimensions. */
  mouth: IAutoMovieHumanMouthSchema;
};
