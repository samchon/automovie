import { tags } from "typia";

/** Euclidean three-dimensional distances on the resting mouth with closed lips, in millimetres, following the [FaceBase inter-landmark protocol](https://www.facebase.org/resources/human/facial_norms/notes/). */
export interface IAutoMovieHumanMouth {
  /** Cheilion to cheilion. */
  width: number & tags.Minimum<15> & tags.Maximum<90>;

  /** Labiale superius to stomion. */
  upperVermilionHeight: number & tags.Minimum<1> & tags.Maximum<25>;

  /** Stomion to labiale inferius. */
  lowerVermilionHeight: number & tags.Minimum<1> & tags.Maximum<25>;
}
