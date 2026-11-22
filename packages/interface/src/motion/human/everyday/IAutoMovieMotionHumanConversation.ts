import type { IAutoMovieRandom } from "../../../core/IAutoMovieRandom";
import type { IAutoMovieMotionHumanGaze } from "../next/IAutoMovieMotionHumanGaze";

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
 * The behaviour is a reader: its methods return the gaze layer requests (or
 * a share of them), not a chain, so it has no `Chain` parameter and the
 * runtime namespace holds plain functions.
 *
 */
export interface IAutoMovieMotionHumanConversation {
  /**
   * A participant's gaze requests through a conversation with one partner.
   *
   * @param params The `subject`, `partner`, `turns`, `random` and `eyes` of `IAutoMovieMotionHumanConversation.IGaze`.
   * @returns Gaze layer requests in time order.
   * @throws {HumanRefusal} For a turn that does not start at a finite film second, at least 0, or does not end at a finite second after its start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the reader returns, its parameters and its refusal.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanConversation.gaze is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanConversation.gaze is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanConversation.gaze is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanConversation.gaze is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanConversation.gaze is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanConversation.gaze is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   */
  gaze(
    params: IAutoMovieMotionHumanConversation.IGaze,
  ): IAutoMovieMotionHumanConversation.IGlances;

  /**
   * A participant's gaze requests through a group conversation: at each turn start the listeners look toward the speaker and the speaker toward the authored addressee.
   *
   * @param params The `subject`, `participants`, `turns`, `random` and `eyes` of `IAutoMovieMotionHumanConversation.IGroupGaze`.
   * @returns Gaze layer requests in time order; the last request of each span releases at its end.
   * @throws When a subject, span, or eye height falls outside the stated bounds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the reader returns, its parameters and its refusal.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanConversation.groupGaze is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanConversation.groupGaze is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanConversation.groupGaze is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanConversation.groupGaze is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanConversation.groupGaze is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanConversation.groupGaze is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   */
  groupGaze(
    params: IAutoMovieMotionHumanConversation.IGroupGaze,
  ): IAutoMovieMotionHumanConversation.IGlances;

  /**
   * The share of a film span in which the requests target a person's face. A request ends at its release or the next request, whichever comes first.
   *
   * @param params The `requests`, `from` and `to` of `IAutoMovieMotionHumanConversation.IShare`.
   * @returns The share in [0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the reader measures, its parameters and its range.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanConversation.share is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanConversation.share is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanConversation.share is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanConversation.share is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanConversation.share is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanConversation.share is provided by the runtime namespace that implements IAutoMovieMotionHumanConversation.
   */
  share(params: IAutoMovieMotionHumanConversation.IShare): number;
}

/**
 * The parameter and result types of the Conversation methods.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names each method's parameters and result with their units: film seconds, metres and subject ids.
 * @evidence contracts/development/design.md#principled-representation Each parameter type holds the arguments of one method, and the result is the Gaze family's own layer request.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The turn, parameter and result types of the Conversation methods only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; no layer type is redefined.
 */
export namespace IAutoMovieMotionHumanConversation {
  /**
   * The gaze requests a conversation reader returns: the Gaze family's layer requests, in time order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the Gaze family's request type as the readers' result.
   * @evidence contracts/development/design.md#principled-representation An alias: the layer request is the Gaze family's own, so the Conversation adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanGaze.ILayer` owns the request; the alias names the readers' result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type IGlances = IAutoMovieMotionHumanGaze.ILayer[];

  /**
   * The parameters of `gaze`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The arguments the reader takes, one per member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the arguments of `gaze`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the turn and stream types the family and engine own.
   */
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

  /**
   * The parameters of `groupGaze`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The arguments the reader takes, one per member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the arguments of `groupGaze`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the turn and stream types the family and engine own.
   */
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

  /**
   * The parameters of `share`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The arguments the reader takes, one per member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the arguments of `share`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the Gaze family's request type.
   */
  export interface IShare {
    /** Gaze requests in chronological order. */
    requests: readonly IAutoMovieMotionHumanGaze.ILayer[];

    /** Span start, film seconds. */
    from: number;

    /** Span end, film seconds, greater than `from`. */
    to: number;
  }

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
