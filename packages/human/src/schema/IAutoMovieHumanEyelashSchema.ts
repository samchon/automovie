import type { IAutoMovieHumanEyelash } from "@automovie/interface";
import type { tags } from "typia";

/**
 * One eye's eyelash input for a typia validator or schema. Length measures the
 * longest upper lash in millimetres and is bounded from 0 to 15.
 */
export type IAutoMovieHumanEyelashSchema = IAutoMovieHumanEyelash & {
  /**
   * Length of the longest upper lash, millimetres; natural lashes rarely exceed 12 mm (Aumond and Bitton 2018, J Optom 11(4):211-222).
   */
  length: number & tags.Minimum<0> & tags.Maximum<15>;
};
