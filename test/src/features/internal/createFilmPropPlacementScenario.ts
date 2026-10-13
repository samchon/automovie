import { validatePropPlacements } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMoviePropSpec, IAutoMovieStageSetPiece } from "@automovie/interface";

import { propEnvironment, propRegistry, propSet } from "./propPlacementFixtures";

/** Fresh original registry ownership for placement predicates; every mutation is isolated while validation laws remain in Engine. */
export const createFilmPropPlacementScenario = () => {
  const TABLE = 0;
  const LAMP = 1;
  const SCONCE = 2;
  const CHARGER = 3;
  const PENDANT = 4;
  const CHIME = 5;
  const CABINET = 6;
  const DOOR = 7;
  const CRATE = 8;
  const SCULPTURE = 9;

  const validate = (
    props: IAutoMoviePropSpec[] = propRegistry(),
    set: IAutoMovieStageSetPiece[] = propSet(),
    builtEnvironments: IAutoMovieBuiltEnvironment[] = [propEnvironment()],
  ) => validatePropPlacements({ props, set, builtEnvironments });

  /**
   * A mutated registry must fail at `path`, and with `message` when one is given.
   *
   * The mutation runs against a fresh registry every time, so a case never
   * inherits the damage of the one before it.
   */
  const violated = (
    mutate: (
      props: IAutoMoviePropSpec[],
      set: IAutoMovieStageSetPiece[],
      environments: IAutoMovieBuiltEnvironment[],
    ) => void,
    path: string,
    message?: string,
  ): boolean => {
    const props = propRegistry();
    const set = propSet();
    const environments = [propEnvironment()];
    mutate(props, set, environments);
    const result = validate(props, set, environments);
    return (
      result.success === false &&
      result.violations.some(
        (item) =>
          item.path === path &&
          (message === undefined || item.expected.includes(message)),
      )
    );
  };

  /** The same mutation, asserted to leave the registry valid. */
  const tolerated = (
    mutate: (
      props: IAutoMoviePropSpec[],
      set: IAutoMovieStageSetPiece[],
      environments: IAutoMovieBuiltEnvironment[],
    ) => void,
  ): boolean => {
    const props = propRegistry();
    const set = propSet();
    const environments = [propEnvironment()];
    mutate(props, set, environments);
    return validate(props, set, environments).success;
  };


  return { validate, violated, tolerated, TABLE, LAMP, SCONCE, CHARGER, PENDANT, CHIME, CABINET, DOOR, CRATE, SCULPTURE };
};
