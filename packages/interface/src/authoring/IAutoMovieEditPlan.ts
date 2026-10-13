import { IAutoMovieNamedId } from "../core/IAutoMovieNamedId";
import { IAutoMovieEditEntry } from "./IAutoMovieEditEntry";

/**
 * Coding-agent-owned edit over shot artifacts that were already built.
 *
 * `cutSequence` folds it into an `IAutoMovieSequence` and reports its runtime;
 * `pacing` and `continuity` are review prose with no deterministic verifier.
 *
 * @evidence contracts/common.md#principled-implementation `cutSequence` checks the plan as editorial arithmetic: a non-blank sequence id, a finite positive frame rate, at least one entry, and each entry's trim and transition bounds; the runtime is the sum of played spans minus each accepted transition's overlap.
 * @evidence contracts/common.md#clear-and-simple-design The plan is the sequence identity, frame rate, ordered entries and two prose fields; the output sequence keeps the same entries, so the plan adds only the rationale the sequence does not carry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pacing and continuity are declared unchecked prose instead of being given a heuristic score, and the display name is passed through without a check that would only test formatting.
 * @evidence contracts/common.md#meaningful-documentation States which function consumes the plan, which fields are checked and how, the frame-rate unit, that order is playback order, and that the prose fields are never read.
 * @author Samchon
 */
export interface IAutoMovieEditPlan {
  /**
   * Stable finished-film identity and display name; only the id is checked,
   * and it must be non-blank.
   */
  sequence: IAutoMovieNamedId;

  /** Finite positive playback frame rate in frames per second. */
  fps: number;

  /** Shot placements in playback order; at least one is required. */
  entries: IAutoMovieEditEntry[];

  /** Why the trims and transitions serve the film's rhythm; never read. */
  pacing: string;

  /**
   * How the end state of each shot connects to the opening of the next across
   * each cut; never read.
   */
  continuity: string;
}
