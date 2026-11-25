import type {
  IAutoMovieBuiltEnvironment,
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createFilmPropPlacementGeometryCases } from "../../../internal/createFilmPropPlacementGeometryCases";
import { createFilmPropPlacementScenario } from "../../../internal/createFilmPropPlacementScenario";
import { namedFacts } from "../../../internal/predicates";

/**
 * Every original geometry refusal retains its full addressed field and adjacent
 * physical contract.
 *
 * Scenarios:
 *
 * 1. Refuse duplicate relations, second occupied spaces/openings, cross-building
 *    fills and support cycles.
 * 2. Locate invalid footprint axes and blank, duplicate, reversed or non-finite
 *    clearances.
 * 3. Refuse containment and opening-fit faults, including a leaf that declares no
 *    occupied space.
 * 4. Detect declared-footprint and ordinary occupancy overlap, blocked clearance,
 *    opening and connector.
 * 5. Distinguish floating, sinking and off-patch support, a second support, and
 *    the corresponding table-top faults.
 */
export function test_unit_engine_film_prop_placement_geometry(): void {
  const scenario: {
    validate: (
      props?: IAutoMoviePropSpec[],
      set?: IAutoMovieStageSetPiece[],
      builtEnvironments?: IAutoMovieBuiltEnvironment[],
    ) => IAutoMovieValidation;
    violated: (
      mutate: (
        props: IAutoMoviePropSpec[],
        set: IAutoMovieStageSetPiece[],
        environments: IAutoMovieBuiltEnvironment[],
      ) => void,
      path: string,
      message?: string,
    ) => boolean;
    tolerated: (
      mutate: (
        props: IAutoMoviePropSpec[],
        set: IAutoMovieStageSetPiece[],
        environments: IAutoMovieBuiltEnvironment[],
      ) => void,
    ) => boolean;
    TABLE: number;
    LAMP: number;
    SCONCE: number;
    CHARGER: number;
    PENDANT: number;
    CHIME: number;
    CABINET: number;
    DOOR: number;
    CRATE: number;
    SCULPTURE: number;
  } = createFilmPropPlacementScenario();
  TestValidator.equals(
    "multiplicity, bounds and geometry failures are located",
    namedFacts(createFilmPropPlacementGeometryCases(scenario)),
    {
      duplicateRelation: true,
      secondOccupiedSpace: true,
      secondFilledOpening: true,
      filledOpeningInAnotherEnvironment: true,
      supportCycle: true,
      footprintAxis: true,
      duplicateClearanceId: true,
      clearanceXOrder: true,
      leavesOccupiedSpace: true,
      doorDoesNotFitOpening: true,
      spacelessLeafIsStillMeasured: true,
      declaredFootprintWidensWhatIsRefused: true,
      occupancyOverlapsUndeclaredProp: true,
      clearanceIntersectsProp: true,
      blocksOpening: true,
      blocksConnector: true,
      floatsAboveItsPatch: true,
      sinksIntoItsPatch: true,
      standsOffItsPatch: true,
      aSecondSupportIsJudgedOnItsOwn: true,
      floatsAboveItsHostTop: true,
      sinksIntoItsHostTop: true,
      standsOffItsHostTop: true,
    },
  );
}
