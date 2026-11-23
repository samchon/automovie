import type { IAutoMovieForgeEntry } from "./IAutoMovieForgeEntry";

/**
 * Coding-agent-authored stand-in model inventory for a script cast.
 *
 * ForgeCast accepts it as a map from cast node to the original model
 * references, or returns the casting and model findings collected by that pass.
 * An entry with an unknown cast node returns before its model is inspected.
 */
export interface IAutoMovieForgePlan {
  /**
   * Exactly one generated stand-in for every cast member whose modelRef is
   * null, and none for a member whose modelRef names an imported asset.
   */
  entries: IAutoMovieForgeEntry[];
}
