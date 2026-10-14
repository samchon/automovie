import type { IAutoMoviePropSpec, IAutoMovieStageSetPiece, IAutoMovieBuiltEnvironment, IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createFilmPropPlacementScenario } from "../internal/createFilmPropPlacementScenario";
import { createFilmPropPlacementGeometryCases } from "../internal/createFilmPropPlacementGeometryCases";
import { namedFacts } from "../internal/predicates";

/**
 * Every original geometry refusal retains its full addressed field and adjacent physical contract.
 *
 * Scenarios:
 * 1. Refuse duplicate relations, second occupied spaces/openings, cross-building fills and support cycles.
 * 2. Locate invalid footprint axes and blank, duplicate, reversed or non-finite clearances.
 * 3. Refuse containment and opening-fit faults, including a leaf that declares no occupied space.
 * 4. Detect declared-footprint and ordinary occupancy overlap, blocked clearance, opening and connector.
 * 5. Distinguish floating, sinking and off-patch support, a second support, and the corresponding table-top faults.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes the existing geometry-case builder and requires every addressed multiplicity, volume, passage and bearing refusal through its real validator calls.
 * @evidence contracts/testing.md#independent-expectations The independently chosen registry mutations and literal field/message expectations describe supported placement rules; the helper returns observed predicates, while the entry supplies the independent all-true requirements.
 * @evidence contracts/testing.md#distinguishing-cases Retains every original duplicate relation, occupied-space/opening multiplicity, support cycle, invalid box/clearance, occupancy/passage and signed-bearing case; adjacent accepted or unmeasurable neighbors are in the boundary entry.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_prop_placement_geometry and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_prop_placement_geometry(): void {
  const scenario: { validate: (props?: IAutoMoviePropSpec[], set?: IAutoMovieStageSetPiece[], builtEnvironments?: IAutoMovieBuiltEnvironment[]) => IAutoMovieValidation; violated: (mutate: (props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]) => void, path: string, message?: string) => boolean; tolerated: (mutate: (props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]) => void) => boolean; TABLE: number; LAMP: number; SCONCE: number; CHARGER: number; PENDANT: number; CHIME: number; CABINET: number; DOOR: number; CRATE: number; SCULPTURE: number; } = createFilmPropPlacementScenario();
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
      blankClearanceId: true,
      duplicateClearanceId: true,
      clearanceXOrder: true,
      clearanceYNotFinite: true,
      clearanceZInfinite: true,
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
