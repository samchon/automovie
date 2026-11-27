import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { AutoMovieArchetypeFirearm } from "../internal/AutoMovieArchetypeFirearm";
import { LONG_GUN_MODELS } from "./LONG_GUN_MODELS";
import type { AutoMovieArchetypeLongGun } from "../AutoMovieArchetypeLongGun";
import { LongGunBandsData } from "./internal/LongGunBandsData";

/*
 * The band of each free dimension of `createLongGun` a model leaves, by kind,
 * with the sources they are read at: kept apart from the producer, with its
 * models, so each file stays within its size.
 */
export const LONG_GUN_BANDS: Readonly<
  Record<
    AutoMovieArchetypeLongGun.Kind,
    Readonly<Partial<Record<AutoMovieArchetypeLongGun.Dimension, IAutoMovieArchetypeBand>>>
  >
> = {
  carbine: {
    length: AutoMovieArchetypeBand.metres(
      30.5 * AutoMovieArchetypeUnits.INCH,
      30.5 * AutoMovieArchetypeUnits.INCH,
      `${LongGunBandsData.CARBINE}: 30.5 in with the stock retracted, all three`,
    ),
    barrel: AutoMovieArchetypeBand.metres(
      14.5 * AutoMovieArchetypeUnits.INCH,
      14.5 * AutoMovieArchetypeUnits.INCH,
      `${LongGunBandsData.CARBINE}: 14.5 in`,
    ),
    lengthOfPull: AutoMovieArchetypeBand.metres(
      10.75 * AutoMovieArchetypeUnits.INCH,
      0.29,
      `a collapsed adjustable stock's 10.75 in pull, seen only in retailer listings; ${LongGunBandsData.UNPUBLISHED} for this carbine`,
      true,
    ),
    travel: AutoMovieArchetypeBand.metres(
      (33.75 - 30.5) * AutoMovieArchetypeUnits.INCH,
      (33.75 - 30.5) * AutoMovieArchetypeUnits.INCH,
      `${LongGunBandsData.CARBINE}: 33.75 in extended less 30.5 in retracted`,
    ),
    sightHeight: AutoMovieArchetypeBand.metres(
      2.6 * AutoMovieArchetypeUnits.INCH,
      2.6 * AutoMovieArchetypeUnits.INCH,
      "a 2.6 in sight plane above the bore, seen only in search results",
      true,
    ),
    muzzleVelocity: AutoMovieArchetypeBand.of(
      "m/s",
      2970 * AutoMovieArchetypeUnits.FOOT,
      2970 * AutoMovieArchetypeUnits.FOOT,
      "FM 3-22.9, Rifle Marksmanship M16-/M4-Series Weapons (2008), Table 2-1, M4-series muzzle velocity 2,970 fps (https://archive.org/details/fm-3-22.9-rifle-marksmanship-m-16-m-4-series-weapons)",
    ),
    lockTime: AutoMovieArchetypeBand.of(
      "s",
      AutoMovieArchetypeFirearm.AR15,
      AutoMovieArchetypeFirearm.AR15,
      "an AR-15's standard hammer's 10 ms, Geissele's Hi-Speed National Match trigger instruction sheet, p. 2, the maker's figure, its method not stated",
      true,
    ),
  },
  shotgun: {
    length: AutoMovieArchetypeBand.metres(
      39.5 * AutoMovieArchetypeUnits.INCH,
      39.5 * AutoMovieArchetypeUnits.INCH,
      `${LongGunBandsData.SHOTGUN}: 39.5 in`,
    ),
    barrel: AutoMovieArchetypeBand.metres(
      18.5 * AutoMovieArchetypeUnits.INCH,
      18.5 * AutoMovieArchetypeUnits.INCH,
      `${LongGunBandsData.SHOTGUN}: 18.5 in`,
    ),
    lengthOfPull: AutoMovieArchetypeBand.metres(
      13.87 * AutoMovieArchetypeUnits.INCH,
      13.87 * AutoMovieArchetypeUnits.INCH,
      `${LongGunBandsData.SHOTGUN}: 13.87 in`,
    ),
    muzzleVelocity: AutoMovieArchetypeBand.of(
      "m/s",
      1325 * AutoMovieArchetypeUnits.FOOT,
      1325 * AutoMovieArchetypeUnits.FOOT,
      "Federal Premium Buckshot P154, 2 3/4 in 00 buck, 1325 fps, its test barrel not stated (https://le.vistaoutdoor.com/ammunition/federal/buckshot/details.aspx?id=472)",
      true,
    ),
    lockTime: AutoMovieArchetypeFirearm.BORROWED,
    travel: AutoMovieArchetypeBand.metres(
      0.08,
      0.1,
      `pump stroke, ${LongGunBandsData.UNPUBLISHED}`,
      true,
    ),
    sightHeight: LongGunBandsData.BEAD,
    mass: AutoMovieArchetypeBand.of(
      "kg",
      3.18,
      3.18,
      `${LongGunBandsData.SHOTGUN}: 7, the unit not stated on the page and taken as pounds`,
      true,
    ),
  },
  musket: {
    lengthOfPull: AutoMovieArchetypeBand.metres(
      LongGunBandsData.PULLS.lever,
      LongGunBandsData.PULLS.shotgun,
      "borrowed from the Marlin 336's and the Mossberg 590A1's read pulls because no record gives the Short Land's length of pull (searched: Museums Victoria, the London Museum, Colonial Williamsburg, Griffiths 1856; records-firearms-flintlock.md)",
      true,
    ),
    sightHeight: LongGunBandsData.BEAD,
    mass: AutoMovieArchetypeBand.of(
      "kg",
      10 * AutoMovieArchetypeUnits.POUND,
      10 * AutoMovieArchetypeUnits.POUND,
      "borrowed from Griffiths, The Artillerist's Manual (1856), p. 1, \"the flintlock musket\" of 10 lb, a US musket's (https://www.gutenberg.org/ebooks/73341.txt.utf-8), because no record gives a Short Land's weight (searched: Museums Victoria, the London Museum, the Royal Armouries, the National Army Museum; records-firearms-flintlock.md)",
      true,
    ),
    muzzleVelocity: AutoMovieArchetypeBand.of(
      "m/s",
      451,
      494,
      `borrowed from ${LongGunBandsData.GRAZ}, because no measured velocity of a British service musket at its service charge was found (searched: Robins 1805, Griffiths 1856, Graz 1995; records-firearms-flintlock.md)`,
      true,
    ),
    lockTime: AutoMovieArchetypeFirearm.FLINTLOCK_TIME,
    ball: AutoMovieArchetypeBand.metres(
      0.689 * AutoMovieArchetypeUnits.INCH,
      0.689 * AutoMovieArchetypeUnits.INCH,
      "borrowed from Griffiths, The Artillerist's Manual (1856), p. 1: the .753 in bore musket of 1842 fires a .689 in ball (https://www.gutenberg.org/ebooks/73341.txt.utf-8), because no record gives the Short Land's ball; the same bore as its nominal .75 (searched: Museums Victoria, the London Museum; records-firearms-flintlock.md)",
      true,
    ),
  },
  rifle: {
    barrel: AutoMovieArchetypeBand.metres(
      20 * AutoMovieArchetypeUnits.INCH,
      LONG_GUN_MODELS.rifle!.kar98k!.barrel!,
      "borrowed from Ruger's American Gen II 46902's 20 in barrel (https://ruger.com/products/americanRifleGenII/specSheets/46902.html) to the Kar 98k's, because neither M1903 manual gives its barrel's length (searched: TM 9-1270, FM 23-10; records-firearms-rifles.md)",
      true,
    ),
    lengthOfPull: AutoMovieArchetypeBand.metres(
      12 * AutoMovieArchetypeUnits.INCH,
      13.75 * AutoMovieArchetypeUnits.INCH,
      "borrowed from Ruger's American Gen II 46902's 12 to 13.75 in pull (https://ruger.com/products/americanRifleGenII/specSheets/46902.html), because neither service rifle's manual gives its pull (searched: TM 9-1270, FM 23-10, German Infantry Weapons 1943; records-firearms-rifles.md)",
      true,
    ),
    sightHeight: LongGunBandsData.BEAD,
    lockTime: AutoMovieArchetypeBand.of(
      "s",
      AutoMovieArchetypeFirearm.M1903,
      AutoMovieArchetypeFirearm.M1903,
      "borrowed from the M1903's service firing pin's 5.7 ms (Garand, US Patent 1,780,521, https://patents.google.com/patent/US1780521A/en) because no measured Mauser 98 lock time was found (searched: records-firearms-locktime.md)",
      true,
    ),
  },
  leverAction: {
    length: AutoMovieArchetypeBand.metres(
      38.625 * AutoMovieArchetypeUnits.INCH,
      38.625 * AutoMovieArchetypeUnits.INCH,
      LongGunBandsData.LEVER,
    ),
    barrel: AutoMovieArchetypeBand.metres(
      20.25 * AutoMovieArchetypeUnits.INCH,
      20.25 * AutoMovieArchetypeUnits.INCH,
      LongGunBandsData.LEVER,
    ),
    lengthOfPull: AutoMovieArchetypeBand.metres(
      LongGunBandsData.PULLS.lever,
      LongGunBandsData.PULLS.lever,
      LongGunBandsData.LEVER,
    ),
    sightHeight: LongGunBandsData.BEAD,
    mass: AutoMovieArchetypeBand.of(
      "kg",
      7.5 * AutoMovieArchetypeUnits.POUND,
      7.5 * AutoMovieArchetypeUnits.POUND,
      LongGunBandsData.LEVER,
    ),
    muzzleVelocity: AutoMovieArchetypeBand.of(
      "m/s",
      2390 * AutoMovieArchetypeUnits.FOOT,
      2390 * AutoMovieArchetypeUnits.FOOT,
      "Winchester .30-30 Win 150 gr Power-Point, 2390 fps, its test barrel not stated (https://winchester.com/Products/Ammunition/Rifle/Power-Point)",
      true,
    ),
    lockTime: AutoMovieArchetypeFirearm.BORROWED,
  },
};
