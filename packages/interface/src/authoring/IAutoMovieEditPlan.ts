import { IAutoMovieNamedId } from "../core/IAutoMovieNamedId";
import { IAutoMovieEditEntry } from "./IAutoMovieEditEntry";

/**
 * Coding-agent-owned edit over already validated shot artifacts.
 *
 * `cutSequence` folds it into an `IAutoMovieSequence`. `pacing` and
 * `continuity` are review prose with no deterministic verifier.
 *
 * @author Samchon
 */
export interface IAutoMovieEditPlan {
  /**
   * Stable finished-film identity and display name; only the id is checked
   * non-blank.
   */
  sequence: IAutoMovieNamedId;

  /** Finite positive playback frame rate in frames per second. */
  fps: number;

  /** Shot placements in playback order; at least one is required. */
  entries: IAutoMovieEditEntry[];

  /** Why the trims and transitions serve the film's rhythm. */
  pacing: string;

  /** How adjacent opening/end states connect across each cut. */
  continuity: string;
}
