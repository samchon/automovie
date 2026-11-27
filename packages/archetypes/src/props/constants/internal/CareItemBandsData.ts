
import {
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../../core";

export namespace CareItemBandsData {
  /*
   * A provisional mass band in kilograms.
   */
  export const kg = (minimum: number, maximum: number): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.of(
      "kg",
      minimum,
      maximum,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    );

  /*
   * A facial tissue sheet, from distributor listings.
   */
  export const TISSUE: string =
    "Kleenex facial tissue sheet, 21.3 x 20.3 cm, Kimberly-Clark Professional distributor listings seen only in search results";

  /*
   * Pocket combs, from a maker's pages seen in search results.
   */
  export const COMB: string =
    "Kent Brushes pocket combs, 112 to 154 mm long and 25 to 27 mm wide, product pages seen only in search results";

  /*
   * Toothbrush sizes, from a listing and two patents.
   */
  export const BRUSH: string =
    "Curaprox CS 5460, 18 cm (listing seen only in search results); Canadian patent 3058910, about 194 to 197 mm overall; US patent 6353959, handle 1.375 in round";

  /*
   * A lipstick case read whole; Ellemental's case gives its height but not its
   * width, so it is not built.
   */
  export const LIPSTICK: string =
    "Quadpack magnetic lipstick case, 21 mm across and 74 mm high (https://americas.quadpack.com/?p=16738)";
}
