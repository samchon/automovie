/**
 * One passage a world volume intrudes on.
 *
 * `propBlockedPassages` returns these for one prop's bounds, every blocked
 * opening in the environment's `openings` order and then every blocked
 * connector in `connectors` order, each passage at most once.
 * `validatePropPlacements` turns each into a placement violation.
 */
export interface IAutoMoviePassageBlockage {
  /** Which passage family the blocked id belongs to. */
  kind: "opening" | "connector";

  /** Id of the blocked opening or connector inside the environment. */
  id: string;
}
