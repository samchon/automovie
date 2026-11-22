/**
 * Where a person in a conversation looks: at the partner's face for
 * seeded glances, away between them, more while listening than while
 * speaking.
 *
 * Kendon (1967, Acta Psychol 26:22) and Argyle and Cook (1976, Gaze and
 * Mutual Gaze) found that listeners look at the speaker about 75 % of the
 * time and speakers at the listener about 40 %, in glances of a few seconds.
 * Each participant's gaze alternates glances at the partner's face and looks
 * away; glance and away durations are drawn from exponential distributions
 * whose means give those shares: a listener 3 s on and 1 s away, a speaker
 * 2 s on and 3 s away (glance means provisional, chosen inside the few
 * seconds reported, so that `on / (on + away)` is the cited share). A look
 * away goes to a point 25 degrees to a seeded side of the participant's
 * heading and 10 degrees below the eyes; conversing people face each other,
 * so that is beside and below the partner. A turn boundary starts a new glance at the
 * partner, as speakers look up at the end of their turn (Kendon 1967).
 *
 * The result is a gaze layer's requests, so the conversation's gaze never
 * cuts the bodies' actions. In a group, each span can name a different
 * addressee so the gaze follows the authored exchange.
 *
 * @evidence contracts/development/common.md#meaningful-documentation speaker: The speaker's subject id. from: Film second the turn starts. to: Film second the turn ends.
 * @evidence contracts/development/design.md#principled-representation speaker: The speaker's subject id. from: Film second the turn starts. to: Film second the turn ends.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/HumanConversation.ts (HumanConversation.gaze, turns).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanConversation.gaze.
 */
export namespace IAutoMovieMotionHumanConversation {
  /**
   * A participant's gaze requests through a conversation. One speaking turn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation speaker: The speaker's subject id. from: Film second the turn starts. to: Film second the turn ends.
   * @evidence contracts/development/design.md#principled-representation speaker: The speaker's subject id. from: Film second the turn starts. to: Film second the turn ends.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/HumanConversation.ts (HumanConversation.gaze, turns).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanConversation.gaze.
   */
  export interface ITurn {
    /** The speaker's subject id. */
    speaker: string;

    /** Film second the turn starts. */
    from: number;

    /** Film second the turn ends. */
    to: number;
  }

  /**
   * An authored speaking span with one addressed participant. An author
   * can divide a continuous utterance into spans as its addressee changes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Speaker and addressee identify scene subjects. Inherited from and to give the film-second boundaries.
   * @evidence contracts/development/design.md#principled-representation Each span requires an explicit addressee. HumanConversation.groupGaze validates the roster, distinct roles, finite boundaries and non-overlap.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Adds only the addressee to ITurn for the speaker target read by HumanConversation.groupGaze.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the existing turn and subject identifiers for any group of performers.
   */
  export interface IGroupTurn extends ITurn {
    /** The addressed participant's subject ID. */
    addressee: string;
  }
}
