import type { IAutoMovieHumanScalpHair } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Scalp hair input for a typia validator or schema. Style, curl, hairline and
 * color use the existing vocabularies. The longest straightened hair length is
 * in millimetres, with zero denoting a shaved scalp.
 */
export type IAutoMovieHumanScalpHairSchema = IAutoMovieHumanScalpHair & {
  /**
   * Longest scalp-to-tip length in millimetres when straightened. Zero denotes a shaved scalp.
   */
  length: number & tags.Minimum<0> & tags.Maximum<1500>;
};
