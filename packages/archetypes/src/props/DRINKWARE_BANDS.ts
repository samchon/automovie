import { AutoMovieHandAnthropometry } from "@automovie/engine";
import type { IAutoMovieHandAnthropometry } from "@automovie/interface";

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import type { createDrinkware } from "./createDrinkware";

/** A band in kilograms. */
const kg = (
  minimum: number,
  maximum: number,
  source: string,
  provisional?: boolean,
): IAutoMovieArchetypeBand =>
  AutoMovieArchetypeBand.of("kg", minimum, maximum, source, provisional);

/**
 * The ISO 3591 tasting glass as a maker's conformity sheet reproduces its
 * drawing.
 */
const ISO_3591: string =
  "ISO 3591:1977 tasting glass, as reproduced with tolerances by the Culina conformity sheet (https://pim.culina.no/Documents/Memo%20filsti%20dokumenter/Samsvarserkl%C3%A6ring/Vinsmakerglass%20ISO%203591%201977.pdf)";

/** Two makers' 330 ml longneck beer bottles. */
const LONGNECK: string =
  "O-I Beer and Cider Bottle Selection 2017 (https://brewersguild.org.nz/wp-content/uploads/2024/04/2017-O-I-Glass-Guide-Beer-Cider-Bottle-Selection.pdf) and Berlin Packaging Long Neck SE 330 ml (https://berlinpackaging.eu/en-international/products/long-neck-se-330ml-cr-26-flint)";

/** A maker's 500 ml PET bottle. */
const PET: string =
  "Petainer 500 ml soda bottle PCO 1881 (https://www.petainer.com/pet-plastic-bottles/soda-bottles/500ml-soda-bottle-28mm-pco-1881); taller listings of the same maker seen only in search results";

/** A maker's 750 ml wine bottle and heavier listings. */
const BORDEAUX: string =
  "Croxsons Rightweight Bordeaux 750 ml (https://www.croxsons.com/?p=7284); the upper end from other makers' listings seen only in search results";

/**
 * A diner mug read at a dealer; IKEA's 365+ mug page gives the mug's height but
 * the package's diameter, so it is not built.
 */
const MUG: string =
  "ITI 82245-02 diner mug 10 oz, 3.88 in high and 3.5 in across (https://www.katom.com/129-8224502.html)";

/** A maker's porcelain cup, read. */
const CUP: string =
  "BHS tabletop SMART cup 0.18 l: diameter 90 mm, height 55 mm, 180 g (https://www.bhs-tabletop.com/en-en/product/smart-cup-000675528511000000-sku-000675526811000000/)";

/**
 * The fingers a cup's or a mug's handle loop admits: the population hand table
 * `@automovie/engine`'s `AutoMovieHandAnthropometry` holds.
 */
const FINGER_SOURCE: string =
  "Rastgoo Balov, Allahyari, Jafari and Hajaghazadeh 2026, Hand anthropometry, grip strength, and manual dexterity, SAGE Open Med, doi 10.1177/20503121261428206 (PMC13039577), Tables 1 and 2: index and middle fingers' breadth and girth at their second joint from the tip, women's and men's means";

/**
 * The handle bar's thickness, an industrial handle's read range standing in for
 * a cup handle's, which no study read gives.
 */
const BAR: string =
  "Elesa+Ganter GN 425 U-handles, bar diameter d1 8 to 16 mm (https://www.elesa-ganter.in/siteassets/PDF/EN/GN%20425.pdf), an industrial-handle analogue: no maker or ergonomic study read gives a cup handle bar's thickness (search recorded), and the fingers' grasp reads the loop's clearance, not the bar";

/** Two bar glasses read at distributor listings only. */
const GLASS: string =
  "Libbey 5139 pint and Libbey 2045 highball glasses, distributor listings seen only in search results";

/**
 * A finger's depth through the loop, millimetres: the larger of the two bounds
 * its girth and breadth set on a joint's depth, the square root of the girth
 * squared over four less the breadth squared, as the human figure's digit box
 * takes it, so the loop admits the finger.
 */
const depth = (finger: IAutoMovieHandAnthropometry.IJoint): number =>
  Math.sqrt(finger.girth ** 2 / 4 - finger.breadth ** 2);

/**
 * A hand's loop, metres: the index's and the middle finger's breadths at their
 * second joint from the tip side by side, and the thicker one's depth; women's
 * means, then men's.
 */
const loop = (k: 0 | 1): { tall: number; deep: number } => {
  const index: IAutoMovieHandAnthropometry.IJoint =
    AutoMovieHandAnthropometry.JOINTS[k][1]![1];
  const middle: IAutoMovieHandAnthropometry.IJoint =
    AutoMovieHandAnthropometry.JOINTS[k][2]![1];
  return {
    tall: (index.breadth + middle.breadth) * AutoMovieArchetypeUnits.MILLIMETRE,
    deep:
      Math.max(depth(index), depth(middle)) *
      AutoMovieArchetypeUnits.MILLIMETRE,
  };
};

/**
 * A mug's and a cup's handle bands: the loop admitting the women's to the men's
 * two fingers, and the industrial-handle analogue bar.
 */
const LOOP: Readonly<
  Record<
    "handleDiameter" | "handleOpening" | "handleLoop",
    IAutoMovieArchetypeBand
  >
> = {
  handleDiameter: AutoMovieArchetypeBand.metres(0.008, 0.016, BAR, true),
  handleOpening: AutoMovieArchetypeBand.metres(
    loop(0).deep,
    loop(1).deep,
    `${FINGER_SOURCE}: the thicker finger's depth, the square root of its girth squared over four less its breadth squared`,
  ),
  handleLoop: AutoMovieArchetypeBand.metres(
    loop(0).tall,
    loop(1).tall,
    `${FINGER_SOURCE}: the two fingers' breadths side by side`,
  ),
};

/**
 * The band of each free dimension of {@link createDrinkware}, by kind, with the
 * sources they are read at: kept apart from the producer so each file stays
 * within its size. One cited band per dimension per kind, in metres and
 * kilograms, read as `createDrinkware.BANDS`, a mug's and a cup's handle bands
 * also as `createDrinkware.LOOP`; every band names its source, and one not read
 * at its primary source is provisional.
 */
export const DRINKWARE_BANDS: Readonly<
  Record<
    createDrinkware.Kind,
    Readonly<
      Partial<Record<createDrinkware.Dimension, IAutoMovieArchetypeBand>>
    >
  >
> = {
  mug: {
    height: AutoMovieArchetypeBand.metres(
      3.88 * AutoMovieArchetypeUnits.INCH,
      3.88 * AutoMovieArchetypeUnits.INCH,
      MUG,
    ),
    diameter: AutoMovieArchetypeBand.metres(
      3.5 * AutoMovieArchetypeUnits.INCH,
      3.5 * AutoMovieArchetypeUnits.INCH,
      MUG,
    ),
    ...LOOP,
    mass: kg(
      0.25,
      0.35,
      "IKEA 365+ mug package weight 0.29 kg (https://www.ikea.com/ie/en/p/ikea-365-mug-white-20282942/)",
      true,
    ),
  },
  cup: {
    height: AutoMovieArchetypeBand.metres(0.055, 0.055, CUP),
    diameter: AutoMovieArchetypeBand.metres(0.09, 0.09, CUP),
    ...LOOP,
    mass: kg(0.18, 0.18, CUP),
  },
  glass: {
    height: AutoMovieArchetypeBand.metres(0.14, 0.15, GLASS, true),
    diameter: AutoMovieArchetypeBand.metres(0.083, 0.089, GLASS, true),
    mass: kg(0.3, 0.45, AutoMovieArchetypeBand.TYPICAL_MASS, true),
  },
  wineGlass: {
    height: AutoMovieArchetypeBand.metres(0.15, 0.16, ISO_3591),
    diameter: AutoMovieArchetypeBand.metres(0.063, 0.067, ISO_3591),
    stemLength: AutoMovieArchetypeBand.metres(0.052, 0.058, ISO_3591),
    stemDiameter: AutoMovieArchetypeBand.metres(0.008, 0.01, ISO_3591),
    baseDiameter: AutoMovieArchetypeBand.metres(0.06, 0.07, ISO_3591),
    mass: kg(0.1, 0.15, AutoMovieArchetypeBand.TYPICAL_MASS, true),
  },
  beerBottle: {
    neckDiameter: AutoMovieArchetypeBand.metres(
      0.026,
      0.026,
      `${LONGNECK}: 26 mm crown finish`,
    ),
  },
  waterBottle: {
    height: AutoMovieArchetypeBand.metres(0.197, 0.229, PET, true),
    diameter: AutoMovieArchetypeBand.metres(0.065, 0.065, PET),
    neckDiameter: AutoMovieArchetypeBand.metres(0.028, 0.028, PET),
    mass: kg(0.0225, 0.043, PET, true),
  },
  wineBottle: {
    height: AutoMovieArchetypeBand.metres(0.2895, 0.329, BORDEAUX, true),
    diameter: AutoMovieArchetypeBand.metres(0.0733, 0.086, BORDEAUX, true),
    neckDiameter: AutoMovieArchetypeBand.metres(
      0.029,
      0.031,
      "outer neck round the 18.5 mm bore Wikipedia's Wine bottle article states (https://en.wikipedia.org/wiki/Wine_bottle); the wall is an estimate",
      true,
    ),
    mass: kg(
      0.3,
      0.9,
      `${BORDEAUX}; range of Wikipedia's Wine bottle article`,
      true,
    ),
  },
};
