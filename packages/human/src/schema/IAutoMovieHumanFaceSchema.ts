import type {
  IAutoMovieHumanFace,
  IAutoMovieHumanPair,
} from "@automovie/interface";
import type { tags } from "typia";

import type { IAutoMovieHumanEyeSchema } from "./IAutoMovieHumanEyeSchema";
import type { IAutoMovieHumanMouthSchema } from "./IAutoMovieHumanMouthSchema";
import type { IAutoMovieHumanNoseSchema } from "./IAutoMovieHumanNoseSchema";

/** Typia admission/schema metadata for IAutoMovieHumanFace. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
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
