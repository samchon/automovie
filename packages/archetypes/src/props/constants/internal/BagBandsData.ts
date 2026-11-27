
import {
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../../core";

export namespace BagBandsData {
  /*
   * Tote sizes and handle lengths from a maker's listing seen in search results.
   */
  export const TOTE: string =
    "L.L.Bean Boat and Tote, small 10.5 x 9.5 x 5 in to large 15 x 17 x 7.5 in with 6 to 8 in handles, product listing seen only in search results";

  /*
   * Shoulder strap drops from a maker's pages seen in search results.
   */
  export const STRAP: string =
    "Coach handbag pages, detachable strap with 21.75 to 25 in drop, seen only in search results";

  /*
   * Two backpacks from listings seen in search results.
   */
  export const BACKPACK: string =
    "JanSport SuperBreak, 16.7 x 13 x 8.5 in and 0.3 kg, and Fjallraven Kanken 16 L, 38 x 27 x 13 cm and 0.3 kg, listings seen only in search results";

  /*
   * The optimal handle of the Revised NIOSH Lifting Equation, applied to a
   * carried container's handle whose own size no maker gives.
   */
  export const NIOSH: string =
    'Waters, Putz-Anderson and Garg, Applications Manual for the Revised NIOSH Lifting Equation, DHHS (NIOSH) 94-110 (1994), Table 6 note 1, p. 30: "An optimal handle design has .75 - 1.5 inches (1.9 to 3.8 cm) diameter, >= 4.5 inches (11.5 cm) length, 2 inches (5 cm) clearance, cylindrical shape" (https://stacks.cdc.gov/view/cdc/209665/cdc_209665_DS1.pdf), applied to this handle';

  /*
   * The NIOSH optimal handle's diameters applied to a tote's handles and strap
   * and a backpack's straps, flat webbing in a hook grip whose width no maker
   * read gives.
   */
  export const WEBBING: string =
    "the 1.9 to 3.8 cm optimal handle diameter of the Applications Manual for the Revised NIOSH Lifting Equation, DHHS (NIOSH) 94-110, Table 6 note 1, p. 30 (https://stacks.cdc.gov/view/cdc/209665/cdc_209665_DS1.pdf), applied to a strap's webbing: no maker read states a strap's width (searched for the Fjallraven Kanken's, 2026-11-15; only the Kanken Mini's 25 mm, at a retailer)";

  /*
   * Two attache cases, seen only in search results; the larger of each case's two
   * face sizes taken as its width.
   */
  export const ATTACHE: string =
    "Samsonite Focus III 6 in attache, 39.4 x 45.2 x 14.7 cm, 2.95 kg (https://www.samsonite.ca/en/bags/laptop-bags-%26-briefcases/samsonite-focus-iii-6%22-attach%C3%A9/10558XXXX.html), and Rimowa aluminium attache, 35 x 41.5 x 8.5 cm, 2.3 kg (https://rimowa.com/us/en/bags/attache/briefcase/90007010.html), seen only in search results";

  /*
   * A maker's handbag, read at a retailer, its other handle drop and its weight
   * seen only in search results.
   */
  export const HANDBAG: string =
    "Longchamp Le Pliage Original M: height 28, width 30, depth 20 cm, handle drop 11 cm (https://www.selfridges.com/IE/en/product/longchamp-le-pliage-medium-recycled-nylon-top-handle-bag_R03885492/); a 12 cm handle height on Longchamp's Indonesian page and a 240 g weight seen only in search results";

  /*
   * A maker's duffel, seen only in search results.
   */
  export const DUFFEL: string =
    "The North Face Base Camp Duffel M, 14 x 25 x 14 in, 3 lb 9.1 oz (1620 g) (https://www.sunandski.com/p/93240061700002402), seen only in search results";

  /*
   * A maker's toolbox, read, its weight seen only in search results.
   */
  export const TOOLBOX: string =
    "Stanley 19 in Essential toolbox STST1-75520, 48.2 x 25.4 x 25 cm (https://www.stanleytools.co.uk/product/stst1-75520/stanley-19-essential-tool-box); its 1.5 kg seen only in search results";

  /*
   * The NIOSH optimal handle's diameters, metres, applied to a cased or carried
   * bag's handle bar.
   */
  export const NIOSH_HANDLE: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
    0.019,
    0.038,
    NIOSH,
    true,
  );

  /*
   * The same diameters applied to a strap's webbing.
   */
  export const NIOSH_WEBBING: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
    NIOSH_HANDLE.minimum,
    NIOSH_HANDLE.maximum,
    WEBBING,
    true,
  );
}
