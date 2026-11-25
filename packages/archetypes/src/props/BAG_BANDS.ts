import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import type { createBag } from "./createBag";

/** Tote sizes and handle lengths from a maker's listing seen in search results. */
const TOTE: string =
  "L.L.Bean Boat and Tote, small 10.5 x 9.5 x 5 in to large 15 x 17 x 7.5 in with 6 to 8 in handles, product listing seen only in search results";

/** Shoulder strap drops from a maker's pages seen in search results. */
const STRAP: string =
  "Coach handbag pages, detachable strap with 21.75 to 25 in drop, seen only in search results";

/** Two backpacks from listings seen in search results. */
const BACKPACK: string =
  "JanSport SuperBreak, 16.7 x 13 x 8.5 in and 0.3 kg, and Fjallraven Kanken 16 L, 38 x 27 x 13 cm and 0.3 kg, listings seen only in search results";

/**
 * The optimal handle of the Revised NIOSH Lifting Equation, applied to a
 * carried container's handle whose own size no maker gives.
 */
const NIOSH: string =
  'Waters, Putz-Anderson and Garg, Applications Manual for the Revised NIOSH Lifting Equation, DHHS (NIOSH) 94-110 (1994), Table 6 note 1, p. 30: "An optimal handle design has .75 - 1.5 inches (1.9 to 3.8 cm) diameter, >= 4.5 inches (11.5 cm) length, 2 inches (5 cm) clearance, cylindrical shape" (https://stacks.cdc.gov/view/cdc/209665/cdc_209665_DS1.pdf), applied to this handle';

/**
 * The NIOSH optimal handle's diameters applied to a tote's handles and strap
 * and a backpack's straps, flat webbing in a hook grip whose width no maker
 * read gives.
 */
const WEBBING: string =
  "the 1.9 to 3.8 cm optimal handle diameter of the Applications Manual for the Revised NIOSH Lifting Equation, DHHS (NIOSH) 94-110, Table 6 note 1, p. 30 (https://stacks.cdc.gov/view/cdc/209665/cdc_209665_DS1.pdf), applied to a strap's webbing: no maker read states a strap's width (searched for the Fjallraven Kanken's, 2026-11-15; only the Kanken Mini's 25 mm, at a retailer)";

/**
 * Two attache cases, seen only in search results; the larger of each case's two
 * face sizes taken as its width.
 */
const ATTACHE: string =
  "Samsonite Focus III 6 in attache, 39.4 x 45.2 x 14.7 cm, 2.95 kg (https://www.samsonite.ca/en/bags/laptop-bags-%26-briefcases/samsonite-focus-iii-6%22-attach%C3%A9/10558XXXX.html), and Rimowa aluminium attache, 35 x 41.5 x 8.5 cm, 2.3 kg (https://rimowa.com/us/en/bags/attache/briefcase/90007010.html), seen only in search results";

/**
 * A maker's handbag, read at a retailer, its other handle drop and its weight
 * seen only in search results.
 */
const HANDBAG: string =
  "Longchamp Le Pliage Original M: height 28, width 30, depth 20 cm, handle drop 11 cm (https://www.selfridges.com/IE/en/product/longchamp-le-pliage-medium-recycled-nylon-top-handle-bag_R03885492/); a 12 cm handle height on Longchamp's Indonesian page and a 240 g weight seen only in search results";

/** A maker's duffel, seen only in search results. */
const DUFFEL: string =
  "The North Face Base Camp Duffel M, 14 x 25 x 14 in, 3 lb 9.1 oz (1620 g) (https://www.sunandski.com/p/93240061700002402), seen only in search results";

/** A maker's toolbox, read, its weight seen only in search results. */
const TOOLBOX: string =
  "Stanley 19 in Essential toolbox STST1-75520, 48.2 x 25.4 x 25 cm (https://www.stanleytools.co.uk/product/stst1-75520/stanley-19-essential-tool-box); its 1.5 kg seen only in search results";

/**
 * The NIOSH optimal handle's diameters, metres, applied to a cased or carried
 * bag's handle bar.
 */
const NIOSH_HANDLE: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
  0.019,
  0.038,
  NIOSH,
  true,
);

/** The same diameters applied to a strap's webbing. */
const NIOSH_WEBBING: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
  NIOSH_HANDLE.minimum,
  NIOSH_HANDLE.maximum,
  WEBBING,
  true,
);

/**
 * The band of each free dimension of `createBag`, by kind, with the sources
 * they are read at: kept apart from the producer so each file stays within its
 * size.
 */
export const BAG_BANDS: typeof createBag.BANDS = {
  tote: {
    width: AutoMovieArchetypeBand.metres(
      9.5 * AutoMovieArchetypeUnits.INCH,
      17 * AutoMovieArchetypeUnits.INCH,
      TOTE,
      true,
    ),
    height: AutoMovieArchetypeBand.metres(
      10.5 * AutoMovieArchetypeUnits.INCH,
      15 * AutoMovieArchetypeUnits.INCH,
      TOTE,
      true,
    ),
    depth: AutoMovieArchetypeBand.metres(
      5 * AutoMovieArchetypeUnits.INCH,
      7.5 * AutoMovieArchetypeUnits.INCH,
      TOTE,
      true,
    ),
    handleDrop: AutoMovieArchetypeBand.metres(
      6 * AutoMovieArchetypeUnits.INCH,
      8 * AutoMovieArchetypeUnits.INCH,
      TOTE,
      true,
    ),
    strapDrop: AutoMovieArchetypeBand.metres(
      21.75 * AutoMovieArchetypeUnits.INCH,
      25 * AutoMovieArchetypeUnits.INCH,
      STRAP,
      true,
    ),
    handleDiameter: NIOSH_WEBBING,
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.4,
      0.9,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  },
  backpack: {
    width: AutoMovieArchetypeBand.metres(
      0.27,
      13 * AutoMovieArchetypeUnits.INCH,
      BACKPACK,
      true,
    ),
    height: AutoMovieArchetypeBand.metres(
      0.38,
      16.7 * AutoMovieArchetypeUnits.INCH,
      BACKPACK,
      true,
    ),
    depth: AutoMovieArchetypeBand.metres(
      0.13,
      8.5 * AutoMovieArchetypeUnits.INCH,
      BACKPACK,
      true,
    ),
    handleDiameter: NIOSH_WEBBING,
    mass: AutoMovieArchetypeBand.of("kg", 0.3, 0.3, BACKPACK, true),
  },
  suitcase: {
    handleDiameter: NIOSH_HANDLE,
    mass: AutoMovieArchetypeBand.of(
      "kg",
      3.2,
      4.3,
      "Rimowa Essential and Classic Cabin, 3.2 and 4.3 kg, product pages seen only in search results",
      true,
    ),
  },
  briefcase: {
    width: AutoMovieArchetypeBand.metres(0.415, 0.452, ATTACHE, true),
    height: AutoMovieArchetypeBand.metres(0.35, 0.394, ATTACHE, true),
    depth: AutoMovieArchetypeBand.metres(0.085, 0.147, ATTACHE, true),
    handleDiameter: NIOSH_HANDLE,
    mass: AutoMovieArchetypeBand.of("kg", 2.3, 2.95, ATTACHE, true),
  },
  toolbox: {
    width: AutoMovieArchetypeBand.metres(0.482, 0.482, TOOLBOX),
    height: AutoMovieArchetypeBand.metres(0.25, 0.25, TOOLBOX),
    depth: AutoMovieArchetypeBand.metres(0.254, 0.254, TOOLBOX),
    handleDiameter: NIOSH_HANDLE,
    mass: AutoMovieArchetypeBand.of("kg", 1.5, 1.5, TOOLBOX, true),
  },
  handbag: {
    width: AutoMovieArchetypeBand.metres(0.3, 0.3, HANDBAG),
    height: AutoMovieArchetypeBand.metres(0.28, 0.28, HANDBAG),
    depth: AutoMovieArchetypeBand.metres(0.2, 0.2, HANDBAG),
    handleDrop: AutoMovieArchetypeBand.metres(0.11, 0.12, HANDBAG, true),
    handleDiameter: NIOSH_HANDLE,
    mass: AutoMovieArchetypeBand.of("kg", 0.24, 0.24, HANDBAG, true),
  },
  duffel: {
    width: AutoMovieArchetypeBand.metres(
      25 * AutoMovieArchetypeUnits.INCH,
      25 * AutoMovieArchetypeUnits.INCH,
      DUFFEL,
      true,
    ),
    height: AutoMovieArchetypeBand.metres(
      14 * AutoMovieArchetypeUnits.INCH,
      14 * AutoMovieArchetypeUnits.INCH,
      DUFFEL,
      true,
    ),
    depth: AutoMovieArchetypeBand.metres(
      14 * AutoMovieArchetypeUnits.INCH,
      14 * AutoMovieArchetypeUnits.INCH,
      DUFFEL,
      true,
    ),
    handleDiameter: NIOSH_HANDLE,
    mass: AutoMovieArchetypeBand.of("kg", 1.62, 1.62, DUFFEL, true),
  },
};
