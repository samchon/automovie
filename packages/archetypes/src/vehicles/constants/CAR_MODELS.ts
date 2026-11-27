import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeCar } from "../AutoMovieArchetypeCar";
import { CarModelsData } from "./internal/CarModelsData";


/*
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
      AutoMovieArchetypeCar.Kind,
      Readonly<
        Partial<
          Record<
            AutoMovieArchetypeCar.Model,
            Readonly<Partial<Record<AutoMovieArchetypeCar.Dimension, number>>>
          >
        >
      >
    >
  >;
  ranges: Readonly<
    Partial<
      Record<
        AutoMovieArchetypeCar.Model,
        Readonly<
          Partial<
            Record<AutoMovieArchetypeCar.Dimension, IAutoMovieArchetypeBand>
          >
        >
      >
    >
  >;
  tyres: Readonly<
    Partial<
      Record<
        AutoMovieArchetypeCar.Model,
        Readonly<
          Partial<
            Record<
              AutoMovieArchetypeCar.Tyre,
              Readonly<Partial<Record<AutoMovieArchetypeCar.Dimension, number>>>
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
        ...CarModelsData.JAZZ,
        wheelDiameter: CarModelsData.tyre(185, 60, 15),
        lockTurns: 2.51,
      },
      jazzAdvance: {
        ...CarModelsData.JAZZ,
        wheelDiameter: CarModelsData.tyre(185, 55, 16),
        lockTurns: 2.35,
      },
      jazzCrosstarAdvance: {
        length: 4.105,
        width: 1.725,
        height: 1.526,
        wheelbase: 2.52,
        wheelDiameter: CarModelsData.tyre(185, 60, 16),
        lockTurns: 2.63,
      },
      jazzAdvanceSport: {
        ...CarModelsData.JAZZ,
        wheelDiameter: CarModelsData.tyre(185, 55, 16),
        lockTurns: 2.35,
      },
      civicElegance: {
        ...CarModelsData.CIVIC,
        wheelDiameter: CarModelsData.tyre(215, 50, 17),
        lockTurns: 2.3,
      },
      civicSport: {
        ...CarModelsData.CIVIC,
        wheelDiameter: CarModelsData.tyre(235, 40, 18),
        lockTurns: 2.2,
        mass: 1503,
      },
      civicAdvance: {
        ...CarModelsData.CIVIC,
        wheelDiameter: CarModelsData.tyre(235, 40, 18),
        lockTurns: 2.2,
      },
    },
    sedan: {
      corolla: { length: 4.63, width: 1.78, wheelbase: 2.7 },
      camry: { width: 1.84, height: 1.445, wheelbase: 2.82 },
    },
    van: {
      transitL1: CarModelsData.TRANSIT_L1,
      transitL2: {
        length: CarModelsData.TRANSIT_L2_LENGTH,
        frontOverhang: CarModelsData.TRANSIT_NOSE,
        width: 2.032,
        height: 1.966,
        wheelbase: 3.5,
        loadLength:
          CarModelsData.TRANSIT_L1.loadLength! + (CarModelsData.TRANSIT_L2_LENGTH - CarModelsData.TRANSIT_L1.length!),
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
        `${CarModelsData.HONDA}: Jazz Elegance kerb weight 1230-1247 kg`,
      ),
    },
    jazzAdvance: {
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1230,
        1247,
        `${CarModelsData.HONDA}: Jazz Advance kerb weight 1230-1247 kg`,
      ),
    },
    jazzCrosstarAdvance: {
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1248,
        1253,
        `${CarModelsData.HONDA}: Jazz Crosstar Advance kerb weight 1248-1253 kg`,
      ),
    },
    jazzAdvanceSport: {
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1242,
        1244,
        `${CarModelsData.HONDA}: Jazz Advance Sport kerb weight 1242-1244 kg`,
      ),
    },
    civicElegance: {
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1445,
        1503,
        `${CarModelsData.HONDA}: Civic Elegance kerb weight 1445-1503 kg`,
      ),
    },
    civicAdvance: {
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1461,
        1503,
        `${CarModelsData.HONDA}: Civic Advance kerb weight 1461-1503 kg`,
      ),
    },
    corolla: {
      height: AutoMovieArchetypeBand.metres(
        1.435,
        1.455,
        `${CarModelsData.TOYOTA}: the international saloon's height, 1,435-1,455 mm`,
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1290,
        1430,
        `${CarModelsData.TOYOTA}: saloon kerb weight 1,290-1,430 kg`,
        true,
      ),
    },
    camry: {
      length: AutoMovieArchetypeBand.metres(
        4.88,
        4.91,
        `${CarModelsData.TOYOTA}: Camry length 4,880-4,910 mm`,
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1480,
        1660,
        `${CarModelsData.TOYOTA}: Camry curb weight 1,480-1,660 kg`,
        true,
      ),
    },
    transitL1: {
      height: AutoMovieArchetypeBand.metres(
        1.968,
        1.983,
        `${CarModelsData.TRANSIT}: overall height 1,968-1,983 mm`,
      ),
    },
    transitL2: {
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1864,
        2283,
        `${CarModelsData.TRANSIT_LONG}: kerbweight over the page's engine and trim rows, 1864-2283 kg`,
        true,
      ),
    },
  },
  tyres: {
    transitL1: CarModelsData.TRANSIT_TYRES,
    transitL2: CarModelsData.TRANSIT_TYRES,
    ranger4x2: CarModelsData.RANGER_TYRES,
    ranger4x4: CarModelsData.RANGER_TYRES,
  },
};
