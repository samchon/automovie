import { HumanConversation as HumanConversationSource } from "../everyday/internal/HumanConversation";
import { conversationGaze as conversationGazeLaw } from "../everyday/internal/conversationGaze";
import { conversationGroupGaze as conversationGroupGazeLaw } from "../everyday/internal/conversationGroupGaze";
import { conversationShare as conversationShareLaw } from "../everyday/internal/conversationShare";

/**
 * The Conversation family of motions.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `gaze`: A participant's gaze requests through a conversation with one
 *   partner: the glance model of {@link HumanConversation} (Acarturk et al.
 * - `groupGaze`: Plan a participant's gaze from authored turns in a group
 *   conversation.
 * - `share`: The share of a film span in which the requests target a person's
 *   face.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanConversation`: Where a person in a conversation looks: at the partner's
 *   face for seeded glances, away between them, more while listening than while
 *   speaking.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states.
 */
export namespace AutoMovieMotionHumanConversation {
  /**
   * A participant's gaze requests through a conversation with one partner: the
   * glance model of {@link HumanConversation} (Acarturk et al. 2021, Table 3 and
   * Table 5) applied to the same partner on every turn.
   *
   * @param params The participant, the partner's subject id, the turns in time
   *   order, the participant's stream and the eye height in metres.
   * @returns Gaze layer requests in time order.
   * @throws {AutoMovieMotionHumanRefusal} For a turn that does not start at a finite film
   *   second, at least 0, or does not end at a finite second after its start.
   */
  export const gaze: typeof conversationGazeLaw = conversationGazeLaw;

  /**
   * Plan a participant's gaze from authored turns in a group conversation.
   *
   * At each turn start the listeners look toward the speaker and the speaker
   * looks toward the authored addressee. Auer (2018, doi:10.1075/ais.10.09aue)
   * observed speakers selecting addressees with gaze in three-party
   * interaction. Holler and Kendrick (2015, doi:10.3389/fpsyg.2015.00098)
   * observed unaddressed listeners shifting to the incoming speaker in
   * questions and replies. Here each change starts on the authored boundary.
   * Consecutive spans with one speaker can redirect their address.
   *
   * @param params The participant, the distinct nonempty subject ids including
   *   silent listeners, the ordered non-overlapping speaking spans in film
   *   seconds, the participant's seeded stream and the eye height in metres.
   * @returns Requests for HumanGaze.layer. The last request of each span
   *   releases at its end.
   * @throws When a subject, span, or eye height falls outside the stated
   *   bounds.
   */
  export const groupGaze: typeof conversationGroupGazeLaw =
    conversationGroupGazeLaw;

  /**
   * The share of a film span in which the requests target a person's face. A
   * request ends at its release or the next request, whichever comes first.
   * This measures authored attention without modeling the layer's physical
   * blend.
   *
   * @param params The gaze requests in chronological order and the span's start
   *   and end in film seconds, the end greater than the start.
   * @returns The share in [0, 1].
   */
  export const share: typeof conversationShareLaw = conversationShareLaw;

  /**
   * Where a person in a conversation looks: at the partner's face for seeded
   * glances, away between them, more while listening than while speaking.
   *
   * Acarturk et al. (2021, J Eye Mov Res 14(1):1, mobile eye tracking of mock
   * job interviews) measured both parties: the listening interviewer looked at
   * the face for 3.89 s on average and away for 0.29 s, the speaking
   * interviewee at the face for 1.82 s and away for 0.83 s (Table 3), so a
   * listener spends about 93 % of the time on the partner's face and a speaker
   * about 69 %, more while listening than while speaking as Kendon (1967, Acta
   * Psychol 26:22) and Argyle and Cook (1976) observed. Each participant's gaze
   * alternates glances at the face and looks away, both durations drawn from
   * exponential distributions of those means, the study's standard deviations
   * being about their means. The listener's aversions go diagonally, down and
   * to a seeded side; the speaker's follow the study's mix after a look at the
   * face: right 39 %, left 19 %, down 20 %, diagonal 19 % and up 3 % (Table 5).
   * Each aversion turns the gaze by the eyes' own share of a gaze shift
   * (`HumanGaze.EYES`, under which the head stays put, Freedman 2008), split
   * evenly between aside and down on a diagonal, to a point at the partner's
   * distance, the personal conversation gap (Hall 1966), so the eyes keep their
   * vergence. A turn boundary starts a new glance at the partner, as speakers
   * look up at the end of their turn (Kendon 1967).
   *
   * The result is a gaze layer's requests, so the conversation's gaze never
   * cuts the bodies' actions.
   */
  export import HumanConversation = HumanConversationSource;
}
