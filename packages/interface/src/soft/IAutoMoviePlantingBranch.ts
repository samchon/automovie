import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** One tapered branch segment. */
export interface IAutoMoviePlantingBranch {
  /**
   * Stable branch identity, derived from the path of child ids that made it.
   */
  id: string;

  /** Id of the branch this one emerges from, or `null` for the trunk. */
  parent: string | null;

  /** Recursion level; `0` is the trunk. */
  level: number;

  /** Recipe-frame position of the base. */
  start: IAutoMovieVector3;

  /** Recipe-frame position of the tip, after growth and pruning. */
  end: IAutoMovieVector3;

  /** Radius in metres at the base. */
  radiusStart: number;

  /** Radius in metres at the tip. */
  radiusEnd: number;

  /** Whether the pruning envelope cut this segment short. */
  pruned: boolean;
}
