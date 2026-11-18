import type { IAutoMovieSequenceEntry } from "../cinematics/IAutoMovieSequenceEntry";
import type { IAutoMovieNamedId } from "../core/IAutoMovieNamedId";
import type { IAutoMovieNodeChannel } from "../core/IAutoMovieNodeChannel";

/**
 * Coding-agent-owned edit over shot artifacts that were already built.
 *
 * cutSequence folds it into an IAutoMovieSequence and reports its accumulated runtime in seconds; pacing and continuity rationale are review prose. The cut refuses invalid edit spans and a non-finite runtime. A placement may use two exact built event ids as its source bounds. Optional requirements check that a chosen play retains an interaction event or that a prop channel matches across a hard cut.
 *
 * @evidence contracts/development/design.md#principled-representation `cutSequence` checks the plan as editorial arithmetic: a non-blank sequence id, a finite positive frame rate, at least one entry, and each entry's trim and transition bounds; the runtime is the sum of played spans minus each accepted transition's overlap. Requirements address a zero-based entry and an exact event id or an active prop channel on the output timeline.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The plan is the sequence identity, frame rate, ordered entries plus optional event and prop-channel requirements and two rationale fields. Symbolic trims reuse the built shot events and lower to numeric spans. Requirements and rationale belong to assembly only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Pacing and continuity are declared unchecked prose instead of being given a heuristic score, and the display name is passed through without a check that would only test formatting. An event surviving another play cannot satisfy a requirement and multiple matching events in the addressed play are refused. A prop check reads two played boundary values and refuses missing or ambiguous samples.
 * @evidence contracts/development/common.md#meaningful-documentation States which function consumes the plan, which fields are checked and how, the frame-rate unit, that order is playback order, how requirements address a play or hard cut and that the prose fields are never read.
 */
export interface IAutoMovieEditPlan {
  /**
   * Stable finished-film identity and display name; only the id is checked, and it must be non-blank.
   */
  sequence: IAutoMovieNamedId;

  /** Finite positive playback frame rate in frames per second. */
  fps: number;

  /** Shot placements in playback order; at least one is required. */
  entries: (IAutoMovieSequenceEntry & {
    /**
     * Resolve both bounds in the referenced shot's built events before
     * applying the normal trim and seam rules. The edit gate requires
     * `trim: null` with these bounds. Both ids must be non-blank and each
     * must match exactly once. The end must follow the start on the shot clock.
     */
    trimByEvents?: {
      /** Exact id of the event at the trim start. */
      startEvent: string;

      /** Exact id of the event at the trim end. */
      endEvent: string;
    };
  })[];

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

  /**
   * Compare one sampled prop channel on the two sides of a declared hard cut.
   * Omitted or empty means no prop checks. Both shots must use the same staged
   * scene and write the channel through objectMotions. Reads the outgoing trim
   * end from the left and the incoming trim start inclusively. Without a trim,
   * those times are the outgoing shot duration and incoming time zero.
   * If the outgoing winning track starts, steps or loops exactly at the cut,
   * the check refuses that boundary because the inclusive sampler would read
   * the discarded side. There is no fallback to an unstored staged value.
   */
  requiredPropContinuity?: readonly {
    /** Zero-based index of the incoming play, at least 1. */
    entry: number;

    /** Exact non-blank staged prop node id, including an articulation joint id. */
    node: string;

    /** Component sampled from the same addressed node on both sides. */
    component: IAutoMovieNodeChannel["path"];

    /**
     * Finite inclusive maximum change: Euclidean metres for translation, shortest
     * angle in radians within [0, pi] for rotation, or largest absolute component
     * change for scale and morph weights, both dimensionless. Nonnegative.
     */
    tolerance: number;
  }[];

  /** Why the trims and transitions serve the film's rhythm; never read. */
  pacing: string;

  /**
   * How the end state of each shot connects to the opening of the next across each cut; never read.
   */
  continuity: string;
}
