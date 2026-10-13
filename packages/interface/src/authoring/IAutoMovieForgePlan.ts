import { IAutoMovieForgeEntry } from "./IAutoMovieForgeEntry";

/**
 * Coding-agent-authored stand-in model inventory for a script cast.
 *
 * @author Samchon
 */
export interface IAutoMovieForgePlan {
  /**
   * Exactly one generated stand-in for every cast member without a model, and
   * none for a member whose `modelRef` names an imported asset.
   */
  entries: IAutoMovieForgeEntry[];
}
