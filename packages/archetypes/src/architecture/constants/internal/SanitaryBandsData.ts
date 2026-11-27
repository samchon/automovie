import type { AutoMovieArchetypeSanitary } from "../../AutoMovieArchetypeSanitary";
import type { IAutoMovieArchetypeBand } from "../../../core";
import { AutoMovieArchetypeTap } from "../../AutoMovieArchetypeTap";

export namespace SanitaryBandsData {
  /*
   * The accessibility standard, read.
   */
  export const ADA: string = "2010 ADA Standards (https://www.access-board.gov/ada/)";

  /*
   * The basin read.
   */
  export const KINGSTON: string =
    "Kohler Kingston K-2005 wall-mount basin specification sheet: 21-1/4 x 18-1/8 in (540 x 460 mm), basin 16 x 10 in (406 x 254 mm), basin depth 10-1/8 in (257 mm) (https://techcomm.kohler.com/techcomm/pdf/K-2005_spec_US-CA_Kohler_en.pdf)";

  /*
   * The toilet read.
   */
  export const HIGHLINE: string =
    "Kohler Highline K-3999 specification sheet: bowl front 29-3/4 in (756 mm) from the finished wall, tank 3/4 in (19 mm) off it, 8-5/8 in (219 mm) deep and 18-1/8 in (460 mm) wide with its top 31-1/4 in (794 mm) high, seat holes 16-5/8 in (422 mm) behind the bowl's front (https://techcomm.kohler.com/techcomm/pdf/K-3999_spec_US-CA_Kohler_en.pdf)";

  /*
   * The baths read and searched.
   */
  export const BATH: string =
    "Kohler Bellwether K-837 specification sheet: 60 x 30-1/4 in, 14 in apron, basin bottom 48-3/4 x 19-5/16 in (1238 x 491 mm), water depth 9 in (229 mm), 310 lb (140.6 kg) (https://techcomm.kohler.com/techcomm/pdf/K-837_spec_US-CA_Kohler_en.pdf)";

  /*
   * The steel bath, from a search only.
   */
  export const PRINCETON: string =
    "American Standard Princeton recess bath, 60 x 30 x 14 in and 50 kg, as search results summarise its sheets; not read";

  /*
   * The bands of a basin's mixer: the basin mixer `createTap` cites.
   */
  export const TAP: Readonly<
    Partial<Record<AutoMovieArchetypeSanitary.Dimension, IAutoMovieArchetypeBand>>
  > = {
    tapHeight: AutoMovieArchetypeTap.BANDS.height,
    tapReach: AutoMovieArchetypeTap.BANDS.reach,
    tapOutlet: AutoMovieArchetypeTap.BANDS.outlet,
  };
}
