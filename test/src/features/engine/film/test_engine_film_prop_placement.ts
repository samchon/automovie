import type {
  IAutoMovieBuiltEnvironment,
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createFilmPropPlacementScenario } from "../../internal/createFilmPropPlacementScenario";
import {
  propRegistry,
  propSet,
  sculpture,
} from "../../internal/propPlacementFixtures";

/**
 * Semantic placement keeps the original furnished-room and legacy compatibility
 * inputs.
 *
 * Scenarios:
 *
 * 1. Accept the full furnished room with its support and building relations.
 * 2. Reversing props and set pieces preserves forward-reference admission.
 * 3. A placementless legacy sculpture needs no building environment.
 * 4. Empty prop, set and environment registries remain valid.
 */
export function test_engine_film_prop_placement(): void {
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
  const {
    validate,
    SCULPTURE,
  }: {
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
  } = scenario;
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
