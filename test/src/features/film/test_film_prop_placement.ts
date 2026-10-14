import type { IAutoMoviePropSpec, IAutoMovieStageSetPiece, IAutoMovieBuiltEnvironment, IAutoMovieValidation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createFilmPropPlacementScenario } from "../internal/createFilmPropPlacementScenario";
import { propRegistry, propSet, sculpture } from "../internal/propPlacementFixtures";

/**
 * Semantic placement keeps the original furnished-room and legacy compatibility inputs.
 *
 * Scenarios:
 * 1. Accept the full room, reversed declaration order, placementless legacy sculpture and empty registries.
 *
 * @evidence contracts/testing.md#behavioral-verification Validates the furnished registry, reversed declaration order, placementless legacy prop and empty registries through the existing placement scenario helper.
 * @evidence contracts/testing.md#independent-expectations The fixture declares a geometrically supported room and unique joins, so success and order invariance follow the placement contract; expected success is literal rather than copied from a validation snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the complete room, forward-reference reversal, placementless legacy input and empty collections; addressed negative identities, geometry and adjacent silences belong to the sibling placement entries.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_prop_placement and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_prop_placement(): void {
  const scenario: { validate: (props?: IAutoMoviePropSpec[], set?: IAutoMovieStageSetPiece[], builtEnvironments?: IAutoMovieBuiltEnvironment[]) => IAutoMovieValidation; violated: (mutate: (props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]) => void, path: string, message?: string) => boolean; tolerated: (mutate: (props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]) => void) => boolean; TABLE: number; LAMP: number; SCONCE: number; CHARGER: number; PENDANT: number; CHIME: number; CABINET: number; DOOR: number; CRATE: number; SCULPTURE: number; } = createFilmPropPlacementScenario();
  const { validate, SCULPTURE }: { validate: (props?: IAutoMoviePropSpec[], set?: IAutoMovieStageSetPiece[], builtEnvironments?: IAutoMovieBuiltEnvironment[]) => IAutoMovieValidation; violated: (mutate: (props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]) => void, path: string, message?: string) => boolean; tolerated: (mutate: (props: IAutoMoviePropSpec[], set: IAutoMovieStageSetPiece[], environments: IAutoMovieBuiltEnvironment[]) => void) => boolean; TABLE: number; LAMP: number; SCONCE: number; CHARGER: number; PENDANT: number; CHIME: number; CABINET: number; DOOR: number; CRATE: number; SCULPTURE: number; } = scenario;
  TestValidator.equals("the furnished room resolves", validate().success, true);
  TestValidator.equals(
    "forward references are declaration-order independent",
    validate(propRegistry().reverse(), propSet().reverse()).success,
    true,
  );
  TestValidator.equals(
    "a legacy registry without placements stays compatible",
    validate([sculpture()], [propSet()[SCULPTURE]!], []).success,
    true,
  );
  TestValidator.equals(
    "empty registries stay compatible",
    validate([], [], []).success,
    true,
  );


}
