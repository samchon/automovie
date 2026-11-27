import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import type { AutoMovieArchetypeLight } from "./AutoMovieArchetypeLight";

/** Taper candles, seen only in search results. */
const TAPER: string =
  "IKEA VINTERFINT and KLOKHET unscented taper candles, 25 to 26 cm long and 22 mm across, twenty KLOKHET packed at 1.29 kg, so 64.5 g each, seen only in search results";

/** Hand-held fire torches, seen only in search results. */
const TORCH: string =
  "fire-performance torches with a cloth wick, 16, 20 and 24 in long, Henry's Spitfire Torch's 65 mm wick, and the ARA ECO, Gora and Mephisto torches' 205 to 265 g, seen only in search results";

/** The handle diameters hands rated most comfortable in a power grip. */
const POWER: string =
  "Kong and Lowe 2005, Int J Ind Ergon 35:495, handles of 30 to 40 mm rated most comfortable (https://stacks.cdc.gov/view/cdc/197408), applied to a torch's shaft, whose own diameter no maker states";

/** IKEA's pendant lamp, read, and its weight seen only in search results. */
const PENDANT: string =
  "IKEA SKURUP pendant lamp, 15 in across, 11 in high, cord 4 ft 11 in (https://www.ikea.com/us/en/p/skurup-pendant-lamp-black-70407124/); its 1.35 kg net and 1.37 kg weights seen only in search results";

/**
 * IKEA's RINGSTA/SKAFTET table lamp, read, its shade's net weight seen only in
 * search results.
 */
const TABLE_LAMP: string =
  "IKEA RINGSTA/SKAFTET table lamp, 41 cm high, base 15 cm, shade 19 cm (https://www.ikea.com/sa/en/p/ringsta-skaftet-table-lamp-white-nickel-plated-s79386565); SKAFTET table lamp base 404.059.56, 30 cm high, base 15 cm, net 0.62 kg (https://www.ikea.com.tw/en/products/luminaires/table-lamps/skaftet-art-40405956); RINGSTA shade 904.040.92, 19 cm wide, 15 cm high (https://www.ikea.com/gb/en/p/ringsta-lamp-shade-white-90404092/), its 0.19 kg net seen only in search results";

/** IKEA's RINGSTA/SKAFTET floor lamp, read. */
const FLOOR_LAMP: string =
  "IKEA RINGSTA/SKAFTET floor lamp, 153 cm high, base 29 cm, shade 42 cm (https://www.ikea.com/gb/en/p/ringsta-skaftet-floor-lamp-white-nickel-plated-s99387446); SKAFTET floor lamp base 804.055.39, 130 cm high, base 29 cm, net 3.06 kg (https://www.ikea.com.tw/en/products/luminaires/floor-lamps/skaftet-art-80405539); RINGSTA shade 704.053.61, 42 cm wide, 31 cm high, net 0.49 kg (https://www.ikea.is/en/products/lighting/luminaires/shades-bases-and-cord-set/ringsta-lamp-shade-art-70405361)";

/** Dietz's lantern, read. */
const LANTERN: string =
  "Dietz #20 Junior cold blast lantern: 12 in high, a 5 1/4 in base, 2 lb, its globe 5 1/2 in high and 2 3/8 in across its top and 2 13/16 in across its bottom (https://lanternnet.com/product/dietz-20-junior-cold-blast-lantern/); 16 in high with its handle extended (https://scholarworks.moreheadstate.edu/mh_and_rm_artifacts/23)";

/**
 * The band of each free dimension of `createLight`, by kind, with the sources
 * they are read at: kept apart from the producer so each file stays within its
 * size.
 */
export const LIGHT_BANDS: Readonly<
  Record<
    AutoMovieArchetypeLight.Kind,
    Readonly<Partial<Record<AutoMovieArchetypeLight.Dimension, IAutoMovieArchetypeBand>>>
  >
> = {
  candle: {
    length: AutoMovieArchetypeBand.metres(0.25, 0.26, TAPER, true),
    diameter: AutoMovieArchetypeBand.metres(0.022, 0.022, TAPER, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.0645, 0.0645, TAPER, true),
  },
  fireTorch: {
    length: AutoMovieArchetypeBand.metres(
      16 * AutoMovieArchetypeUnits.INCH,
      24 * AutoMovieArchetypeUnits.INCH,
      TORCH,
      true,
    ),
    diameter: AutoMovieArchetypeBand.metres(0.03, 0.04, POWER, true),
    headDiameter: AutoMovieArchetypeBand.metres(0.065, 0.065, TORCH, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.205, 0.265, TORCH, true),
  },
  pendant: {
    height: AutoMovieArchetypeBand.metres(
      11 * AutoMovieArchetypeUnits.INCH,
      11 * AutoMovieArchetypeUnits.INCH,
      PENDANT,
    ),
    shade: AutoMovieArchetypeBand.metres(
      15 * AutoMovieArchetypeUnits.INCH,
      15 * AutoMovieArchetypeUnits.INCH,
      PENDANT,
    ),
    cord: AutoMovieArchetypeBand.metres(
      4 * AutoMovieArchetypeUnits.FOOT + 11 * AutoMovieArchetypeUnits.INCH,
      4 * AutoMovieArchetypeUnits.FOOT + 11 * AutoMovieArchetypeUnits.INCH,
      PENDANT,
    ),
    mass: AutoMovieArchetypeBand.of("kg", 1.35, 1.37, PENDANT, true),
  },
  tableLamp: {
    overall: AutoMovieArchetypeBand.metres(0.41, 0.41, TABLE_LAMP),
    stem: AutoMovieArchetypeBand.metres(0.3, 0.3, TABLE_LAMP),
    base: AutoMovieArchetypeBand.metres(0.15, 0.15, TABLE_LAMP),
    height: AutoMovieArchetypeBand.metres(0.15, 0.15, TABLE_LAMP),
    shade: AutoMovieArchetypeBand.metres(0.19, 0.19, TABLE_LAMP),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.62 + 0.19,
      0.62 + 0.19,
      `${TABLE_LAMP}: the base's and the shade's net weights together`,
      true,
    ),
  },
  floorLamp: {
    overall: AutoMovieArchetypeBand.metres(1.53, 1.53, FLOOR_LAMP),
    stem: AutoMovieArchetypeBand.metres(1.3, 1.3, FLOOR_LAMP),
    base: AutoMovieArchetypeBand.metres(0.29, 0.29, FLOOR_LAMP),
    height: AutoMovieArchetypeBand.metres(0.31, 0.31, FLOOR_LAMP),
    shade: AutoMovieArchetypeBand.metres(0.42, 0.42, FLOOR_LAMP),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      3.06 + 0.49,
      3.06 + 0.49,
      `${FLOOR_LAMP}: the base's and the shade's net weights together`,
    ),
  },
  lantern: {
    overall: AutoMovieArchetypeBand.metres(
      12 * AutoMovieArchetypeUnits.INCH,
      12 * AutoMovieArchetypeUnits.INCH,
      LANTERN,
    ),
    bail: AutoMovieArchetypeBand.metres(
      16 * AutoMovieArchetypeUnits.INCH,
      16 * AutoMovieArchetypeUnits.INCH,
      LANTERN,
    ),
    base: AutoMovieArchetypeBand.metres(
      (5 + 1 / 4) * AutoMovieArchetypeUnits.INCH,
      (5 + 1 / 4) * AutoMovieArchetypeUnits.INCH,
      LANTERN,
    ),
    height: AutoMovieArchetypeBand.metres(
      (5 + 1 / 2) * AutoMovieArchetypeUnits.INCH,
      (5 + 1 / 2) * AutoMovieArchetypeUnits.INCH,
      LANTERN,
    ),
    shade: AutoMovieArchetypeBand.metres(
      (2 + 13 / 16) * AutoMovieArchetypeUnits.INCH,
      (2 + 13 / 16) * AutoMovieArchetypeUnits.INCH,
      LANTERN,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      2 * AutoMovieArchetypeUnits.POUND,
      2 * AutoMovieArchetypeUnits.POUND,
      LANTERN,
    ),
  },
};
