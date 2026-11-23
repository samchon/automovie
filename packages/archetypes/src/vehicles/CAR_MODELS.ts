import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import type { createCar } from "./createCar";

/** The hatchbacks, read at their maker's specification pages. */
const HONDA: string =
  "Honda UK specifications (https://www.honda.co.uk/cars/new/jazz-hybrid/specifications.html, https://www.honda.co.uk/cars/new/civic-hybrid/specifications.html)";

/**
 * The sedans, read at a secondary source: one search for each maker's sheet
 * found none.
 */
const TOYOTA: string =
  "the Toyota Corolla (E210) saloon and Camry (XV70) infoboxes, secondary: one search for each maker's sheet found none (https://en.wikipedia.org/wiki/Toyota_Corolla_(E210), https://en.wikipedia.org/wiki/Toyota_Camry_(XV70))";

/** The short van, read at its maker's technical specification. */
const TRANSIT: string =
  "Ford Transit Custom 2023 technical specification, L1H1 van, p. 3 (https://www.fordpers.be/content/documents/news/2023/2023_10_09_transit_custom_2023_technical_specification_eu.pdf)";

/**
 * The long van, read at a dealer's guide only: one search for the maker's sheet
 * found none.
 */
const TRANSIT_LONG: string =
  "the vansdirect.co.uk sizing guide's L2 H1 Transit Custom, secondary: one search for Ford's L2 sheet found none (https://www.vansdirect.co.uk/load-sizing-guide/ford-transit-custom-dimensions/)";

/** A tyre's outer diameter from its size (`AutoMovieArchetypeUnits.tyre`). */
const tyre: typeof AutoMovieArchetypeUnits.tyre = AutoMovieArchetypeUnits.tyre;

/**
 * The Jazz's body, every grade's but the Crosstar's: 4089 x 1694 x 1526 mm on a
 * 2517 mm wheelbase.
 */
const JAZZ: Readonly<Partial<Record<createCar.Dimension, number>>> = {
  length: 4.089,
  width: 1.694,
  height: 1.526,
  wheelbase: 2.517,
};

/**
 * The Civic's body, every grade's: 4560 x 1802 x 1408 mm on a 2734 mm
 * wheelbase.
 */
const CIVIC: Readonly<Partial<Record<createCar.Dimension, number>>> = {
  length: 4.56,
  width: 1.802,
  height: 1.408,
  wheelbase: 2.734,
};

/**
 * The Transit Custom's front overhang, metres: 958 mm from the front of the van
 * to the front wheels' centre, CarExpert's MK3 listings and a Ford brochure
 * seen in search results, secondary; with the 992 mm rear overhang it closes
 * both bodies exactly, 958 + 3,100 + 992 = 5,050 mm and 958 + 3,500 + 992 =
 * 5,450 mm.
 */
const TRANSIT_NOSE: number = 0.958;

/**
 * The Transit Custom L1's read figures, the L2's load length being derived from
 * them: Ford's specification, p. 3.
 */
const TRANSIT_L1: Readonly<Partial<Record<createCar.Dimension, number>>> = {
  length: 5.05,
  width: 2.032,
  wheelbase: 3.1,
  frontOverhang: TRANSIT_NOSE,
  mass: 1892,
  loadLength: 2.394,
};

/**
 * The Transit Custom L2's overall length, metres: the dealer's guide's 5,450
 * mm.
 */
const TRANSIT_L2_LENGTH: number = 5.45;

/**
 * The Transit Custom's tyres: 215/65 R16C on its standard wheels, 215/60 R17C
 * on its optional ones (p. 2).
 */
const TRANSIT_TYRES: Readonly<
  Partial<
    Record<
      createCar.Tyre,
      Readonly<Partial<Record<createCar.Dimension, number>>>
    >
  >
> = {
  r16c: { wheelDiameter: tyre(215, 65, 16) },
  r17c: { wheelDiameter: tyre(215, 60, 17) },
};

/**
 * The Ranger's tyres, by wheel option rather than drive: 255/70R17 on the
 * 17-inch wheels, 255/65R18 on the 18-inch (p. 2).
 */
const RANGER_TYRES: Readonly<
  Partial<
    Record<
      createCar.Tyre,
      Readonly<Partial<Record<createCar.Dimension, number>>>
    >
  >
> = {
  r17: { wheelDiameter: tyre(255, 70, 17) },
  r18: { wheelDiameter: tyre(255, 65, 18) },
};

/**
 * The read car models by class: each model's figures whole, the ranges a single
 * model's source states inside it, and the tyres a model is offered on, picked
 * as their own axis.
 *
 * A hatchback is one of the Jazz's grades (Elegance, Advance, Crosstar Advance,
 * Advance Sport) or the Civic's (Elegance, Sport, Advance), each with its own
 * body, tyre, lock-to-lock turns and kerb mass, read at Honda UK's
 * specification pages; a sedan the Corolla saloon (international) or the Camry,
 * secondary; a van the Transit Custom L1H1, read at Ford's specification, or
 * the L2H1, read at a dealer's guide, secondary, whose load length to the
 * bulkhead is the L1's lengthened by the 400 mm the L2's body is longer; a
 * pickup the 2025 Ranger SuperCrew 4x2 or 4x4, which differ in height, curb
 * weight and lift-in height (Ford's specification, p. 3). A tyre's outer
 * diameter is computed from its size (`tyre`). Where one model's source states
 * a range, as a grade's kerb mass over its options or a saloon's height over
 * its trims, the range is that model's band; nothing is drawn across two
 * models.
 */
export const CAR_MODELS: Readonly<{
  figures: Readonly<
    Record<
      createCar.Kind,
      Readonly<
        Partial<
          Record<
            createCar.Model,
            Readonly<Partial<Record<createCar.Dimension, number>>>
          >
        >
      >
    >
  >;
  ranges: Readonly<
    Partial<
      Record<
        createCar.Model,
        Readonly<Partial<Record<createCar.Dimension, IAutoMovieArchetypeBand>>>
      >
    >
  >;
  tyres: Readonly<
    Partial<
      Record<
        createCar.Model,
        Readonly<
          Partial<
            Record<
              createCar.Tyre,
              Readonly<Partial<Record<createCar.Dimension, number>>>
            >
          >
        >
      >
    >
  >;
}> = {
  figures: {
    hatchback: {
      jazzElegance: {
        ...JAZZ,
        wheelDiameter: tyre(185, 60, 15),
        lockTurns: 2.51,
      },
      jazzAdvance: {
        ...JAZZ,
        wheelDiameter: tyre(185, 55, 16),
        lockTurns: 2.35,
      },
      jazzCrosstarAdvance: {
        length: 4.105,
        width: 1.725,
        height: 1.526,
        wheelbase: 2.52,
        wheelDiameter: tyre(185, 60, 16),
        lockTurns: 2.63,
      },
      jazzAdvanceSport: {
        ...JAZZ,
        wheelDiameter: tyre(185, 55, 16),
        lockTurns: 2.35,
      },
      civicElegance: {
        ...CIVIC,
        wheelDiameter: tyre(215, 50, 17),
        lockTurns: 2.3,
      },
      civicSport: {
        ...CIVIC,
        wheelDiameter: tyre(235, 40, 18),
        lockTurns: 2.2,
        mass: 1503,
      },
      civicAdvance: {
        ...CIVIC,
        wheelDiameter: tyre(235, 40, 18),
        lockTurns: 2.2,
      },
    },
    sedan: {
      corolla: { length: 4.63, width: 1.78, wheelbase: 2.7 },
      camry: { width: 1.84, height: 1.445, wheelbase: 2.82 },
    },
    van: {
      transitL1: TRANSIT_L1,
      transitL2: {
        length: TRANSIT_L2_LENGTH,
        frontOverhang: TRANSIT_NOSE,
        width: 2.032,
        height: 1.966,
        wheelbase: 3.5,
        loadLength:
          TRANSIT_L1.loadLength! + (TRANSIT_L2_LENGTH - TRANSIT_L1.length!),
      },
    },
    pickup: {
      ranger4x2: {
        height: 73.9 * AutoMovieArchetypeUnits.INCH,
        mass: 4203 * AutoMovieArchetypeUnits.POUND,
        bedFloor: 34.0 * AutoMovieArchetypeUnits.INCH,
      },
      ranger4x4: {
        height: 74.4 * AutoMovieArchetypeUnits.INCH,
        mass: 4415 * AutoMovieArchetypeUnits.POUND,
        bedFloor: 34.7 * AutoMovieArchetypeUnits.INCH,
      },
    },
  },
  ranges: {
    jazzElegance: {
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1230,
        1247,
        `${HONDA}: Jazz Elegance kerb weight 1230-1247 kg`,
      ),
    },
    jazzAdvance: {
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1230,
        1247,
        `${HONDA}: Jazz Advance kerb weight 1230-1247 kg`,
      ),
    },
    jazzCrosstarAdvance: {
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1248,
        1253,
        `${HONDA}: Jazz Crosstar Advance kerb weight 1248-1253 kg`,
      ),
    },
    jazzAdvanceSport: {
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1242,
        1244,
        `${HONDA}: Jazz Advance Sport kerb weight 1242-1244 kg`,
      ),
    },
    civicElegance: {
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1445,
        1503,
        `${HONDA}: Civic Elegance kerb weight 1445-1503 kg`,
      ),
    },
    civicAdvance: {
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1461,
        1503,
        `${HONDA}: Civic Advance kerb weight 1461-1503 kg`,
      ),
    },
    corolla: {
      height: AutoMovieArchetypeBand.metres(
        1.435,
        1.455,
        `${TOYOTA}: the international saloon's height, 1,435-1,455 mm`,
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1290,
        1430,
        `${TOYOTA}: saloon kerb weight 1,290-1,430 kg`,
        true,
      ),
    },
    camry: {
      length: AutoMovieArchetypeBand.metres(
        4.88,
        4.91,
        `${TOYOTA}: Camry length 4,880-4,910 mm`,
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1480,
        1660,
        `${TOYOTA}: Camry curb weight 1,480-1,660 kg`,
        true,
      ),
    },
    transitL1: {
      height: AutoMovieArchetypeBand.metres(
        1.968,
        1.983,
        `${TRANSIT}: overall height 1,968-1,983 mm`,
      ),
    },
    transitL2: {
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1864,
        2283,
        `${TRANSIT_LONG}: kerbweight over the page's engine and trim rows, 1864-2283 kg`,
        true,
      ),
    },
  },
  tyres: {
    transitL1: TRANSIT_TYRES,
    transitL2: TRANSIT_TYRES,
    ranger4x2: RANGER_TYRES,
    ranger4x4: RANGER_TYRES,
  },
};
