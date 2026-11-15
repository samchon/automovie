import { ArchetypeBand, ArchetypeUnits, type IArchetypeBand } from "../core";
import { FlintLock } from "./FlintLock";
import { LONG_GUN_MODELS } from "./LONG_GUN_MODELS";
import { LockTimes } from "./LockTimes";
import type { createLongGun } from "./createLongGun";

/** A carbine's published data, from its maker. */
const CARBINE: string =
  "Colt M4 Carbine specification sheet 2020, R0977HB, R0979 and CR6921 (https://media.shootingsportsmedia.com/downloads/colt-2020-m4-specsheet-rnd7-web.pdf)";

/** A pump shotgun's published data. */
const SHOTGUN: string =
  "Mossberg 590A1 7-shot, product page (https://www.mossberg.com/590a1-m-lok-50765.html)";

/** A lever action's published data, from its maker. */
const LEVER: string =
  "Marlin 336 Classic 70504, product page: .30-30 Win, 20.25 in barrel, 38.625 in overall, 13.38 in length of pull, 7.5 lb, 6-round tube magazine (https://www.marlinfirearms.com/s/model_70504)";

/** The Graz firing tests of historic flintlocks. */
const GRAZ: string =
  "Krenn, Kalaus and Hall, Material History Review 42 (1995), pp. 102-107, Table 1: five flintlock muskets fired at their muzzles 451 to 494 m/s, electrically ignited (https://journals.lib.unb.ca/index.php/MCR/article/download/17669/18944)";

/** The two pulls read on the gun pages here, which a gun whose pull no record gives borrows. */
const PULLS: Readonly<{ shotgun: number; lever: number }> = {
  shotgun: 13.87 * ArchetypeUnits.INCH,
  lever: 13.38 * ArchetypeUnits.INCH,
};

/** A bead's or a front sight's height above the barrel's line, which no maker or record publishes: an estimate. */
const BEAD: IArchetypeBand = ArchetypeBand.metres(
  0.015,
  0.025,
  "a bead's or a front sight's height above the barrel's line, an estimate: no maker or record publishes it (searched: Mossberg's, Marlin's and Ruger's pages, TM 9-1270, FM 23-10, Museums Victoria's musket record; records-firearms-rifles.md, records-firearms-flintlock.md)",
  true,
);

/** Positions along the gun no maker publishes. */
const UNPUBLISHED: string = "not published by the maker; an estimate";

/** The band of each free dimension of `createLongGun` a model leaves, by kind, with the sources they are read at: kept apart from the producer, with its models, so each file stays within its size. */
export const LONG_GUN_BANDS: Readonly<
  Record<
    createLongGun.Kind,
    Readonly<Partial<Record<createLongGun.Dimension, IArchetypeBand>>>
  >
> = {
  carbine: {
    length: ArchetypeBand.metres(
      30.5 * ArchetypeUnits.INCH,
      30.5 * ArchetypeUnits.INCH,
      `${CARBINE}: 30.5 in with the stock retracted, all three`,
    ),
    barrel: ArchetypeBand.metres(
      14.5 * ArchetypeUnits.INCH,
      14.5 * ArchetypeUnits.INCH,
      `${CARBINE}: 14.5 in`,
    ),
    lengthOfPull: ArchetypeBand.metres(
      10.75 * ArchetypeUnits.INCH,
      0.29,
      `a collapsed adjustable stock's 10.75 in pull, seen only in retailer listings; ${UNPUBLISHED} for this carbine`,
      true,
    ),
    travel: ArchetypeBand.metres(
      (33.75 - 30.5) * ArchetypeUnits.INCH,
      (33.75 - 30.5) * ArchetypeUnits.INCH,
      `${CARBINE}: 33.75 in extended less 30.5 in retracted`,
    ),
    sightHeight: ArchetypeBand.metres(
      2.6 * ArchetypeUnits.INCH,
      2.6 * ArchetypeUnits.INCH,
      "a 2.6 in sight plane above the bore, seen only in search results",
      true,
    ),
    muzzleVelocity: ArchetypeBand.of(
      "m/s",
      2970 * ArchetypeUnits.FOOT,
      2970 * ArchetypeUnits.FOOT,
      "FM 3-22.9, Rifle Marksmanship M16-/M4-Series Weapons (2008), Table 2-1, M4-series muzzle velocity 2,970 fps (https://archive.org/details/fm-3-22.9-rifle-marksmanship-m-16-m-4-series-weapons)",
    ),
    lockTime: ArchetypeBand.of(
      "s",
      LockTimes.AR15,
      LockTimes.AR15,
      "an AR-15's standard hammer's 10 ms, Geissele's Hi-Speed National Match trigger instruction sheet, p. 2, the maker's figure, its method not stated",
      true,
    ),
  },
  shotgun: {
    length: ArchetypeBand.metres(
      39.5 * ArchetypeUnits.INCH,
      39.5 * ArchetypeUnits.INCH,
      `${SHOTGUN}: 39.5 in`,
    ),
    barrel: ArchetypeBand.metres(
      18.5 * ArchetypeUnits.INCH,
      18.5 * ArchetypeUnits.INCH,
      `${SHOTGUN}: 18.5 in`,
    ),
    lengthOfPull: ArchetypeBand.metres(
      13.87 * ArchetypeUnits.INCH,
      13.87 * ArchetypeUnits.INCH,
      `${SHOTGUN}: 13.87 in`,
    ),
    muzzleVelocity: ArchetypeBand.of(
      "m/s",
      1325 * ArchetypeUnits.FOOT,
      1325 * ArchetypeUnits.FOOT,
      "Federal Premium Buckshot P154, 2 3/4 in 00 buck, 1325 fps, its test barrel not stated (https://le.vistaoutdoor.com/ammunition/federal/buckshot/details.aspx?id=472)",
      true,
    ),
    lockTime: LockTimes.BORROWED,
    travel: ArchetypeBand.metres(
      0.08,
      0.1,
      `pump stroke, ${UNPUBLISHED}`,
      true,
    ),
    sightHeight: BEAD,
    mass: ArchetypeBand.of(
      "kg",
      3.18,
      3.18,
      `${SHOTGUN}: 7, the unit not stated on the page and taken as pounds`,
      true,
    ),
  },
  musket: {
    lengthOfPull: ArchetypeBand.metres(
      PULLS.lever,
      PULLS.shotgun,
      "borrowed from the Marlin 336's and the Mossberg 590A1's read pulls because no record gives the Short Land's length of pull (searched: Museums Victoria, the London Museum, Colonial Williamsburg, Griffiths 1856; records-firearms-flintlock.md)",
      true,
    ),
    sightHeight: BEAD,
    mass: ArchetypeBand.of(
      "kg",
      10 * ArchetypeUnits.POUND,
      10 * ArchetypeUnits.POUND,
      "borrowed from Griffiths, The Artillerist's Manual (1856), p. 1, \"the flintlock musket\" of 10 lb, a US musket's (https://www.gutenberg.org/ebooks/73341.txt.utf-8), because no record gives a Short Land's weight (searched: Museums Victoria, the London Museum, the Royal Armouries, the National Army Museum; records-firearms-flintlock.md)",
      true,
    ),
    muzzleVelocity: ArchetypeBand.of(
      "m/s",
      451,
      494,
      `borrowed from ${GRAZ}, because no measured velocity of a British service musket at its service charge was found (searched: Robins 1805, Griffiths 1856, Graz 1995; records-firearms-flintlock.md)`,
      true,
    ),
    lockTime: FlintLock.TIME,
    ball: ArchetypeBand.metres(
      0.689 * ArchetypeUnits.INCH,
      0.689 * ArchetypeUnits.INCH,
      "borrowed from Griffiths, The Artillerist's Manual (1856), p. 1: the .753 in bore musket of 1842 fires a .689 in ball (https://www.gutenberg.org/ebooks/73341.txt.utf-8), because no record gives the Short Land's ball; the same bore as its nominal .75 (searched: Museums Victoria, the London Museum; records-firearms-flintlock.md)",
      true,
    ),
  },
  rifle: {
    barrel: ArchetypeBand.metres(
      20 * ArchetypeUnits.INCH,
      LONG_GUN_MODELS.rifle!.kar98k!.barrel!,
      "borrowed from Ruger's American Gen II 46902's 20 in barrel (https://ruger.com/products/americanRifleGenII/specSheets/46902.html) to the Kar 98k's, because neither M1903 manual gives its barrel's length (searched: TM 9-1270, FM 23-10; records-firearms-rifles.md)",
      true,
    ),
    lengthOfPull: ArchetypeBand.metres(
      12 * ArchetypeUnits.INCH,
      13.75 * ArchetypeUnits.INCH,
      "borrowed from Ruger's American Gen II 46902's 12 to 13.75 in pull (https://ruger.com/products/americanRifleGenII/specSheets/46902.html), because neither service rifle's manual gives its pull (searched: TM 9-1270, FM 23-10, German Infantry Weapons 1943; records-firearms-rifles.md)",
      true,
    ),
    sightHeight: BEAD,
    lockTime: ArchetypeBand.of(
      "s",
      LockTimes.M1903,
      LockTimes.M1903,
      "borrowed from the M1903's service firing pin's 5.7 ms (Garand, US Patent 1,780,521, https://patents.google.com/patent/US1780521A/en) because no measured Mauser 98 lock time was found (searched: records-firearms-locktime.md)",
      true,
    ),
  },
  leverAction: {
    length: ArchetypeBand.metres(
      38.625 * ArchetypeUnits.INCH,
      38.625 * ArchetypeUnits.INCH,
      LEVER,
    ),
    barrel: ArchetypeBand.metres(
      20.25 * ArchetypeUnits.INCH,
      20.25 * ArchetypeUnits.INCH,
      LEVER,
    ),
    lengthOfPull: ArchetypeBand.metres(PULLS.lever, PULLS.lever, LEVER),
    sightHeight: BEAD,
    mass: ArchetypeBand.of(
      "kg",
      7.5 * ArchetypeUnits.POUND,
      7.5 * ArchetypeUnits.POUND,
      LEVER,
    ),
    muzzleVelocity: ArchetypeBand.of(
      "m/s",
      2390 * ArchetypeUnits.FOOT,
      2390 * ArchetypeUnits.FOOT,
      "Winchester .30-30 Win 150 gr Power-Point, 2390 fps, its test barrel not stated (https://winchester.com/Products/Ammunition/Rifle/Power-Point)",
      true,
    ),
    lockTime: LockTimes.BORROWED,
  },
};
