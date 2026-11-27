import "@automovie/engine";


import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeDrinkware } from "../AutoMovieArchetypeDrinkware";
import { DrinkwareBandsData } from "./internal/DrinkwareBandsData";


/*
 * The band of each free dimension of createDrinkware, by kind, with the
 * sources they are read at: kept apart from the producer so each file stays
 * within its size. One cited band per dimension per kind, in metres and
 * kilograms, read as `createDrinkware.BANDS`, a mug's and a cup's handle bands
 * also as `createDrinkware.LOOP`; every band names its source, and one not read
 * at its primary source is provisional.
 */
export const DRINKWARE_BANDS: Readonly<
  Record<
    AutoMovieArchetypeDrinkware.Kind,
    Readonly<
      Partial<Record<AutoMovieArchetypeDrinkware.Dimension, IAutoMovieArchetypeBand>>
    >
  >
> = {
  mug: {
    height: AutoMovieArchetypeBand.metres(
      3.88 * AutoMovieArchetypeUnits.INCH,
      3.88 * AutoMovieArchetypeUnits.INCH,
      DrinkwareBandsData.MUG,
    ),
    diameter: AutoMovieArchetypeBand.metres(
      3.5 * AutoMovieArchetypeUnits.INCH,
      3.5 * AutoMovieArchetypeUnits.INCH,
      DrinkwareBandsData.MUG,
    ),
    ...DrinkwareBandsData.LOOP,
    mass: DrinkwareBandsData.kg(
      0.25,
      0.35,
      "IKEA 365+ mug package weight 0.29 kg (https://www.ikea.com/ie/en/p/ikea-365-mug-white-20282942/)",
      true,
    ),
  },
  cup: {
    height: AutoMovieArchetypeBand.metres(0.055, 0.055, DrinkwareBandsData.CUP),
    diameter: AutoMovieArchetypeBand.metres(0.09, 0.09, DrinkwareBandsData.CUP),
    ...DrinkwareBandsData.LOOP,
    mass: DrinkwareBandsData.kg(0.18, 0.18, DrinkwareBandsData.CUP),
  },
  glass: {
    height: AutoMovieArchetypeBand.metres(0.14, 0.15, DrinkwareBandsData.GLASS, true),
    diameter: AutoMovieArchetypeBand.metres(0.083, 0.089, DrinkwareBandsData.GLASS, true),
    mass: DrinkwareBandsData.kg(0.3, 0.45, AutoMovieArchetypeBand.TYPICAL_MASS, true),
  },
  wineGlass: {
    height: AutoMovieArchetypeBand.metres(0.15, 0.16, DrinkwareBandsData.ISO_3591),
    diameter: AutoMovieArchetypeBand.metres(0.063, 0.067, DrinkwareBandsData.ISO_3591),
    stemLength: AutoMovieArchetypeBand.metres(0.052, 0.058, DrinkwareBandsData.ISO_3591),
    stemDiameter: AutoMovieArchetypeBand.metres(0.008, 0.01, DrinkwareBandsData.ISO_3591),
    baseDiameter: AutoMovieArchetypeBand.metres(0.06, 0.07, DrinkwareBandsData.ISO_3591),
    mass: DrinkwareBandsData.kg(0.1, 0.15, AutoMovieArchetypeBand.TYPICAL_MASS, true),
  },
  beerBottle: {
    neckDiameter: AutoMovieArchetypeBand.metres(
      0.026,
      0.026,
      `${DrinkwareBandsData.LONGNECK}: 26 mm crown finish`,
    ),
  },
  waterBottle: {
    height: AutoMovieArchetypeBand.metres(0.197, 0.229, DrinkwareBandsData.PET, true),
    diameter: AutoMovieArchetypeBand.metres(0.065, 0.065, DrinkwareBandsData.PET),
    neckDiameter: AutoMovieArchetypeBand.metres(0.028, 0.028, DrinkwareBandsData.PET),
    mass: DrinkwareBandsData.kg(0.0225, 0.043, DrinkwareBandsData.PET, true),
  },
  wineBottle: {
    height: AutoMovieArchetypeBand.metres(0.2895, 0.329, DrinkwareBandsData.BORDEAUX, true),
    diameter: AutoMovieArchetypeBand.metres(0.0733, 0.086, DrinkwareBandsData.BORDEAUX, true),
    neckDiameter: AutoMovieArchetypeBand.metres(
      0.029,
      0.031,
      "outer neck round the 18.5 mm bore Wikipedia's Wine bottle article states (https://en.wikipedia.org/wiki/Wine_bottle); the wall is an estimate",
      true,
    ),
    mass: DrinkwareBandsData.kg(
      0.3,
      0.9,
      `${DrinkwareBandsData.BORDEAUX}; range of Wikipedia's Wine bottle article`,
      true,
    ),
  },
};
