import { tags } from "typia";

import { AutoMovieHumanHairColor } from "../../typings/AutoMovieHumanHairColor";

/**
 * Eyebrows; their position follows the brow ridge of the identity. A brow is
 * colour painted into the skin's texture over the brow region, not hair
 * geometry.
 */
export interface IAutoMovieHumanBrowAppearance {
  /** Brow hair colour. */
  color: AutoMovieHumanHairColor;

  /**
   * Factor on the brow's width across its length (Park 2017's widths: 9 mm above the medial canthus, 2 mm at the tail); omitted, 1.
   */
  thickness?: number & tags.Minimum<0.3> & tags.Maximum<2>;

  /**
   * Coverage of the skin by brow hair at the brow's full body, from bare skin (0) to solid colour (1); it thins toward the head and the tail as hair does. Omitted, 0.85.
   */
  density?: number & tags.Minimum<0> & tags.Maximum<1>;
}
