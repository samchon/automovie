import type { IAutoMovieSequenceEntry } from "../cinematics/IAutoMovieSequenceEntry";
import type { IAutoMovieNamedId } from "../core/IAutoMovieNamedId";

/**
 * Coding-agent-owned edit over shot artifacts that were already built.
 *
 * cutSequence folds it into an IAutoMovieSequence and reports its accumulated runtime in seconds; pacing and continuity are review prose with no deterministic verifier. The cut refuses invalid edit spans and a non-finite runtime. Optional requirements check whether a chosen play retains a shot interaction event.
 *
 * @evidence contracts/development/design.md#principled-representation `cutSequence` checks the plan as editorial arithmetic: a non-blank sequence id, a finite positive frame rate, at least one entry, and each entry's trim and transition bounds; the runtime is the sum of played spans minus each accepted transition's overlap. Requirements address a zero-based entry and an exact shot event id on the output timeline.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The plan is the sequence identity, frame rate, ordered entries plus optional event requirements and two rationale fields. Requirements and rationale belong to assembly only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Pacing and continuity are declared unchecked prose instead of being given a heuristic score, and the display name is passed through without a check that would only test formatting. An event surviving another play cannot satisfy a requirement and multiple matching events in the addressed play are refused.
 * @evidence contracts/development/common.md#meaningful-documentation States which function consumes the plan, which fields are checked and how, the frame-rate unit, that order is playback order, how event requirements address a play and that the prose fields are never read.
 */
export interface IAutoMovieEditPlan {
  /**
   * Stable finished-film identity and display name; only the id is checked, and it must be non-blank.
   */
  sequence: IAutoMovieNamedId;

  /** Finite positive playback frame rate in frames per second. */
  fps: number;

  /** Shot placements in playback order; at least one is required. */
  entries: IAutoMovieSequenceEntry[];

  /**
   * Require exactly one event with the given id in the given playback entry,
   * after trimming and assigning events on contiguous seams. Events come
   * from the built shot's `events` field, such as an authored prop handoff.
   * Omitting this list or giving an empty list adds no requirements.
   */
  requiredEvents?: readonly {
    /** Zero-based index into `entries` in playback order. */
    entry: number;

    /** Exact non-blank id of the shot interaction event. */
    event: string;
  }[];

  /** Why the trims and transitions serve the film's rhythm; never read. */
  pacing: string;

  /**
   * How the end state of each shot connects to the opening of the next across each cut; never read.
   */
  continuity: string;
}
