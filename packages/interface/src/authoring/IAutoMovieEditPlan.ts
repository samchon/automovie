import type { IAutoMovieSequenceEntry } from "../cinematics/IAutoMovieSequenceEntry";
import type { IAutoMovieNamedId } from "../core/IAutoMovieNamedId";
import type { IAutoMovieNodeChannel } from "../core/IAutoMovieNodeChannel";

/**
 * Coding-agent-owned edit over shot artifacts that were already built.
 *
 * CutSequence folds it into an IAutoMovieSequence and reports its accumulated
 * runtime in seconds; pacing and continuity rationale are review prose. The cut
 * refuses invalid edit spans and a non-finite runtime. A placement may use two
 * exact built event ids as its source bounds. Optional requirements check that
 * a chosen play retains an interaction event or that a prop channel matches
 * across a hard cut.
 */
export interface IAutoMovieEditPlan {
  /** Stable finished-film identity and display name. */
  sequence: IAutoMovieNamedId;

  /** Finite positive playback frame rate in frames per second. */
  fps: number;

  /** Shot placements in playback order; at least one is required. */
  entries: (Omit<IAutoMovieSequenceEntry, "exactSourceEnd"> & {
    /**
     * Resolve both bounds in the referenced shot's built events before applying
     * the normal trim and seam rules. The edit gate requires `trim: null` with
     * these bounds. Each id must match exactly once. The end must follow the
     * start on the shot clock.
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
   * after trimming and assigning events on contiguous seams. Events come from
   * the built shot's `events` field, such as an authored prop handoff. Omitting
   * this list or giving an empty list adds no requirements.
   */
  requiredEvents?: readonly {
    /** Zero-based index into `entries` in playback order. */
    entry: number;

    /** Exact id of the shot interaction event. */
    event: string;
  }[];

  /**
   * Compare one sampled prop channel on the two sides of a declared hard cut.
   * Omitted or empty means no prop checks. Both shots must use the same staged
   * scene and write the channel through objectMotions. Reads the outgoing trim
   * end from the left and the incoming trim start inclusively. For a symbolic
   * trim the selected event supplies the exact end. Without a trim, those times
   * are the outgoing shot duration and incoming time zero. If the outgoing
   * winning track starts, steps or loops exactly at the cut, the check refuses
   * that boundary because the inclusive sampler would read the discarded side.
   * There is no fallback to an unstored staged value.
   */
  requiredPropContinuity?: readonly {
    /** Zero-based index of the incoming play, at least 1. */
    entry: number;

    /** Exact staged prop node id, including an articulation joint id. */
    node: string;

    /** Component sampled from the same addressed node on both sides. */
    component: IAutoMovieNodeChannel["path"];

    /**
     * Finite inclusive maximum change: Euclidean metres for translation,
     * shortest angle in radians within [0, pi] for rotation, or largest
     * absolute component change for scale and morph weights, both
     * dimensionless. Nonnegative.
     */
    tolerance: number;
  }[];

  /** Why the trims and transitions serve the film's rhythm; never read. */
  pacing: string;

  /**
   * How the end state of each shot connects to the opening of the next across
   * each cut; never read.
   */
  continuity: string;
}
