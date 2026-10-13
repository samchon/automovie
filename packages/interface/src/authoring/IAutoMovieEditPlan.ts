import { IAutoMovieNamedId } from "../core/IAutoMovieNamedId";
import { IAutoMovieEditEntry } from "./IAutoMovieEditEntry";

/**
 * Coding-agent-owned edit over already validated shot artifacts.
 *
 * `cutSequence` folds it into an `IAutoMovieSequence`. `pacing` and
 * `continuity` are review prose with no deterministic verifier.
 *
 * @evidence contracts/common.md#principled-implementation `cutSequence` refuses a blank sequence id, a non-finite or non-positive fps and an empty entry list, and computes runtime as the sum of played spans minus each accepted transition's overlap.
 * @evidence contracts/common.md#clear-and-simple-design Separates the agent-owned prose (`pacing`, `continuity`) from the sequence it produces; those fields are carried for review because no cheap check can judge rhythm or continuity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No entry or shot is special-cased; `sequence.name` is copied verbatim and only the id is checked, so a blank display name passes into the sequence.
 * @evidence contracts/common.md#meaningful-documentation States that `sequence` carries a required display name, that fps is frames per second, what `cutSequence` checks, and that pacing and continuity are unchecked prose.
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
