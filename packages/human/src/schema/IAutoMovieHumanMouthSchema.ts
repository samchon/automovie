import type { IAutoMovieHumanMouth } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Closed-mouth measurements for typia validation, in millimetres. Supply the
 * distance between the mouth corners and the upper and lower vermilion heights
 * measured from the closed lip seam.
 */
export type IAutoMovieHumanMouthSchema = IAutoMovieHumanMouth & {
  /** Cheilion to cheilion. */
  width: number & tags.Minimum<15> & tags.Maximum<90>;

  /** Labiale superius to stomion. */
  upperVermilionHeight: number & tags.Minimum<1> & tags.Maximum<25>;

  /** Stomion to labiale inferius. */
  lowerVermilionHeight: number & tags.Minimum<1> & tags.Maximum<25>;
};
