import type { IAutoMovieRandom } from "../../../core/IAutoMovieRandom";
import type { IAutoMovieMotionHumanGaze } from "../next/IAutoMovieMotionHumanGaze";

/** Requests and results for dyadic and group conversation gaze. */
export namespace IAutoMovieMotionHumanConversation {
  /**
   * The gaze requests a conversation reader returns: the Gaze family's layer
   * requests, in time order.
   */
  export type IGlances = IAutoMovieMotionHumanGaze.ILayer[];

  /** The parameters of `gaze`. */
  export interface IGaze {
    /** The participant's subject id. */
    subject: string;

    /** The other participant's subject id; the gaze goes to their face. */
    partner: string;

    /** The turns, in time order. */
    turns: readonly ITurn[];

    /** The participant's stream. */
    random: IAutoMovieRandom;

    /** The participant's eye height, metres, the height a look away turns from. */
    eyes: number;
  }

  /** The parameters of `groupGaze`. */
  export interface IGroupGaze {
    /** The participant whose gaze is being authored. */
    subject: string;

    /** Distinct nonempty subject ids, including silent listeners. */
    participants: readonly string[];

    /** Ordered, non-overlapping speaking spans, in film seconds. */
    turns: readonly IGroupTurn[];

    /** The participant's seeded stream. */
    random: IAutoMovieRandom;

    /** The eye height, metres, in the performer's frame. */
    eyes: number;
  }

  /** The parameters of `share`. */
  export interface IShare {
    /** Gaze requests in chronological order. */
    requests: readonly IAutoMovieMotionHumanGaze.ILayer[];

    /** Span start, film seconds. */
    from: number;

    /** Span end, film seconds, greater than `from`. */
    to: number;
  }

  /** A participant's gaze requests through a conversation. One speaking turn. */
  export interface ITurn {
    /** The speaker's subject id. */
    speaker: string;

    /** Film second the turn starts. */
    from: number;

    /** Film second the turn ends. */
    to: number;
  }

  /**
   * An authored speaking span with one addressed participant. An author can
   * divide a continuous utterance into spans as its addressee changes.
   */
  export interface IGroupTurn extends ITurn {
    /** The addressed participant's subject ID. */
    addressee: string;
  }
}
