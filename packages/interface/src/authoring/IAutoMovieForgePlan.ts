import { IAutoMovieForgeEntry } from "./IAutoMovieForgeEntry";

/** Coding-agent-authored stand-in model inventory for a script cast. */
export interface IAutoMovieForgePlan {
  /** Exactly one generated stand-in for every cast member without a model. */
  entries: IAutoMovieForgeEntry[];
}
