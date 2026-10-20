import { tags } from "typia";

import { AutoMovieHumanHairColor } from "../../typings/AutoMovieHumanHairColor";
import { AutoMovieHumanHairCurl } from "../../typings/AutoMovieHumanHairCurl";
import { AutoMovieHumanHairStyle } from "../../typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanHairline } from "../../typings/AutoMovieHumanHairline";

/**
 * Scalp hair as length, curl, colour and hairline.
 */
export interface IAutoMovieHumanScalpHair {
  /**
   * Cut, one of a closed set of short styles: `crop` lies close all over and points away from the crown's whorl; `short` has tapered back and sides and a longer top combed back from a side parting; `bob` is parted at the midline and hangs to a level cut, at most to the shoulders.
   */
  style: AutoMovieHumanHairStyle;

  /** Hair colour. */
  color: AutoMovieHumanHairColor;

  /**
   * Length of the longest scalp hair from the scalp to the tip, straightened, millimetres; zero is a shaved scalp. The style shapes how lengths vary over the scalp: a crop is even, a short cut tapers to a third of this at the nape and sides, and a bob ends at a level this far below the vertex.
   */
  length: number & tags.Minimum<0> & tags.Maximum<1500>;

  /**
   * Curl pattern as one of the eight L'Oréal types, from straight (I) to tightly coiled (VIII), defined by curve diameter, curl index, waves and twists (as reviewed by Callender et al. 2026, J Cosmet Dermatol 25(4):e70828).
   */
  curl: AutoMovieHumanHairCurl;

  /**
   * Shape of the anterior hairline: `round` is a smooth concave contour; `mShaped` has marked recession at the temples; `rectangular` is a horizontal frontal margin with mild recession; `bellShaped` raises the midline point; `triangular` descends almost straight from the central forehead to the temples.
   */
  hairline: AutoMovieHumanHairline;
}
