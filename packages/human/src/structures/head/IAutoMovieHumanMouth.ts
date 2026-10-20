import { tags } from "typia";

/** Resting mouth measurements with closed lips, in millimetres. */
export interface IAutoMovieHumanMouth {
  /** Cheilion to cheilion. */
  width: number & tags.Minimum<15> & tags.Maximum<90>;

  /** Labiale superius to stomion. */
  upperVermilionHeight: number & tags.Minimum<1> & tags.Maximum<25>;

  /** Stomion to labiale inferius. */
  lowerVermilionHeight: number & tags.Minimum<1> & tags.Maximum<25>;
}
