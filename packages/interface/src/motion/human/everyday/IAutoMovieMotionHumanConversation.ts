import type { IAutoMovieRandom } from "../../../core/IAutoMovieRandom";
import type { IAutoMovieMotionHumanGaze } from "../next/IAutoMovieMotionHumanGaze";

/**
 * Where a person in a conversation looks: at the partner's face for seeded
 * glances, away between them, more while listening than while speaking.
 *
 * Kendon (1967, Acta Psychol 26:22) and Argyle and Cook (1976, Gaze and Mutual
 * Gaze) found that listeners look at the speaker about 75 % of the time and
 * speakers at the listener about 40 %, in glances of a few seconds. Each
 * participant's gaze alternates glances at the partner's face and looks away;
 * glance and away durations are drawn from exponential distributions whose
 * means give those shares: a listener 3 s on and 1 s away, a speaker 2 s on and
 * 3 s away (glance means provisional, chosen inside the few seconds reported,
 * so that `on / (on + away)` is the cited share). A look away goes to a point
 * 25 degrees to a seeded side of the participant's heading and 10 degrees below
 * the eyes; conversing people face each other, so that is beside and below the
 * partner. A turn boundary starts a new glance at the partner, as speakers look
 * up at the end of their turn (Kendon 1967).
 *
 * The result is a gaze layer's requests, so the conversation's gaze never cuts
 * the bodies' actions. In a group, each span can name a different addressee so
 * the gaze follows the authored exchange.
 *
 * The behaviour is a reader: its methods return the gaze layer requests (or a
 * share of them), not a chain, so it has no `Chain` parameter and the runtime
 * namespace holds plain functions.
 */
export interface IAutoMovieMotionHumanConversation {
  /**
   * A participant's gaze requests through a conversation with one partner.
   *
   * @param params The `subject`, `partner`, `turns`, `random` and `eyes` of
   *   `IAutoMovieMotionHumanConversation.IGaze`.
   * @returns Gaze layer requests in time order.
   * @throws {HumanRefusal} For a turn that does not start at a finite film
   *   second, at least 0, or does not end at a finite second after its start.
   */
  gaze(
    params: IAutoMovieMotionHumanConversation.IGaze,
  ): IAutoMovieMotionHumanConversation.IGlances;

  /**
   * A participant's gaze requests through a group conversation: at each turn
   * start the listeners look toward the speaker and the speaker toward the
   * authored addressee.
   *
   * @param params The `subject`, `participants`, `turns`, `random` and `eyes`
   *   of `IAutoMovieMotionHumanConversation.IGroupGaze`.
   * @returns Gaze layer requests in time order; the last request of each span
   *   releases at its end.
   * @throws When a subject, span, or eye height falls outside the stated
   *   bounds.
   */
  groupGaze(
    params: IAutoMovieMotionHumanConversation.IGroupGaze,
  ): IAutoMovieMotionHumanConversation.IGlances;

  /**
   * The share of a film span in which the requests target a person's face. A
   * request ends at its release or the next request, whichever comes first.
   *
   * @param params The `requests`, `from` and `to` of
   *   `IAutoMovieMotionHumanConversation.IShare`.
   * @returns The share in [0, 1].
   */
  share(params: IAutoMovieMotionHumanConversation.IShare): number;
}

/** The parameter and result types of the Conversation methods. */
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
