import {
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../../core";



export namespace LongGunBandsData {
  /*
   * A carbine's published data, from its maker.
   */
  export const CARBINE: string =
    "Colt M4 Carbine specification sheet 2020, R0977HB, R0979 and CR6921 (https://media.shootingsportsmedia.com/downloads/colt-2020-m4-specsheet-rnd7-web.pdf)";

  /*
   * A pump shotgun's published data.
   */
  export const SHOTGUN: string =
    "Mossberg 590A1 7-shot, product page (https://www.mossberg.com/590a1-m-lok-50765.html)";

  /*
   * A lever action's published data, from its maker.
   */
  export const LEVER: string =
    "Marlin 336 Classic 70504, product page: .30-30 Win, 20.25 in barrel, 38.625 in overall, 13.38 in length of pull, 7.5 lb, 6-round tube magazine (https://www.marlinfirearms.com/s/model_70504)";

  /*
   * The Graz firing tests of historic flintlocks.
   */
  export const GRAZ: string =
    "Krenn, Kalaus and Hall, Material History Review 42 (1995), pp. 102-107, Table 1: five flintlock muskets fired at their muzzles 451 to 494 m/s, electrically ignited (https://journals.lib.unb.ca/index.php/MCR/article/download/17669/18944)";

  /*
   * The two pulls read on the gun pages here, which a gun whose pull no record
   * gives borrows.
   */
  export const PULLS: Readonly<{ shotgun: number; lever: number }> = {
    shotgun: 13.87 * AutoMovieArchetypeUnits.INCH,
    lever: 13.38 * AutoMovieArchetypeUnits.INCH,
  };

  /*
   * A bead's or a front sight's height above the barrel's line, which no maker or
   * record publishes: an estimate.
   */
  export const BEAD: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
    0.015,
    0.025,
    "a bead's or a front sight's height above the barrel's line, an estimate: no maker or record publishes it (searched: Mossberg's, Marlin's and Ruger's pages, TM 9-1270, FM 23-10, Museums Victoria's musket record; records-firearms-rifles.md, records-firearms-flintlock.md)",
    true,
  );

  /*
   * Positions along the gun no maker publishes.
   */
  export const UNPUBLISHED: string = "not published by the maker; an estimate";
}
