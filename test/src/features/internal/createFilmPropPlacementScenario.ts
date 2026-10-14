import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieConstraintViolation,
  IAutoMoviePropSpec,
  IAutoMovieStageSetPiece,
  IAutoMovieValidation,
} from "@automovie/interface";

import { validatePropPlacements } from "@automovie/engine";
import {
  propEnvironment,
  propRegistry,
  propSet,
} from "./propPlacementFixtures";

/**
 * Fresh original registry ownership for placement predicates; every mutation is isolated while validation laws remain in Engine.
 *
 * Behavior: Builds the original slot ids and fresh registry mutation readers used by placement entries to observe real validatePropPlacements results and addressed refusals.
 * Expectation basis: Callers supply contract-derived paths/messages and literal expected predicates; this helper constructs inputs and reads results without deriving expected geometry from the validator.
 * Cases: Preserves isolated valid/violated/tolerated registry calls and all ten original slots; identity, geometry and adjacent-boundary case lists remain with their existing owners.
 * Execution: The existing owning entries call createFilmPropPlacementScenario during their portable in-memory cases and retain responsibility for assertion expectations and dynamically invoked predicates; this helper acquires no asset, process, renderer or GPU and keeps no completed-result cache.
 */
export function createFilmPropPlacementScenario(): {
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
} {
  const TABLE: number = 0;
  const LAMP: number = 1;
  const SCONCE: number = 2;
  const CHARGER: number = 3;
  const PENDANT: number = 4;
  const CHIME: number = 5;
  const CABINET: number = 6;
  const DOOR: number = 7;
  const CRATE: number = 8;
  const SCULPTURE: number = 9;

  /** Run real placement validation against the supplied records or fresh original registry defaults. */
  const validate: (
    props?: IAutoMoviePropSpec[],
    set?: IAutoMovieStageSetPiece[],
    builtEnvironments?: IAutoMovieBuiltEnvironment[],
  ) => IAutoMovieValidation = (
    props: IAutoMoviePropSpec[] = propRegistry(),
    set: IAutoMovieStageSetPiece[] = propSet(),
    builtEnvironments: IAutoMovieBuiltEnvironment[] = [propEnvironment()],
  ): IAutoMovieValidation =>
    validatePropPlacements({ props, set, builtEnvironments });

  /**
   * A mutated registry must fail at `path`, and with `message` when one is given.
   *
   * The mutation runs against a fresh registry every time, so a case never inherits the damage of the one before it.
   */
  const violated: (
    mutate: (
      props: IAutoMoviePropSpec[],
      set: IAutoMovieStageSetPiece[],
      environments: IAutoMovieBuiltEnvironment[],
    ) => void,
    path: string,
    message?: string,
  ) => boolean = (
    mutate: (
      props: IAutoMoviePropSpec[],
      set: IAutoMovieStageSetPiece[],
      environments: IAutoMovieBuiltEnvironment[],
    ) => void,
    path: string,
    message?: string,
  ): boolean => {
    const props: IAutoMoviePropSpec[] = propRegistry();
    const set: IAutoMovieStageSetPiece[] = propSet();
    const environments: IAutoMovieBuiltEnvironment[] = [propEnvironment()];
    mutate(props, set, environments);
    const result: IAutoMovieValidation = validate(props, set, environments);
    return (
      result.success === false &&
      result.violations.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path === path &&
          (message === undefined || item.expected.includes(message)),
      )
    );
  };

  /** The same mutation, asserted to leave the registry valid. */
  const tolerated: (
    mutate: (
      props: IAutoMoviePropSpec[],
      set: IAutoMovieStageSetPiece[],
      environments: IAutoMovieBuiltEnvironment[],
    ) => void,
  ) => boolean = (
    mutate: (
      props: IAutoMoviePropSpec[],
      set: IAutoMovieStageSetPiece[],
      environments: IAutoMovieBuiltEnvironment[],
    ) => void,
  ): boolean => {
    const props: IAutoMoviePropSpec[] = propRegistry();
    const set: IAutoMovieStageSetPiece[] = propSet();
    const environments: IAutoMovieBuiltEnvironment[] = [propEnvironment()];
    mutate(props, set, environments);
    return validate(props, set, environments).success;
  };

  return {
    validate,
    violated,
    tolerated,
    TABLE,
    LAMP,
    SCONCE,
    CHARGER,
    PENDANT,
    CHIME,
    CABINET,
    DOOR,
    CRATE,
    SCULPTURE,
  };
}
