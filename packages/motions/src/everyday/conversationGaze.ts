import type { IAutoMovieMotionHumanConversation } from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanConversation } from "./HumanConversation";

/**
 * A participant's gaze requests through a conversation with one partner: the
 * glance model of {@link HumanConversation} (Acarturk et al. 2021, Table 3
 * and Table 5) applied to the same partner on every turn.
 *
 * @param params The participant, the partner's subject id, the turns in time order, the participant's stream and the eye height in metres.
 * @returns Gaze layer requests in time order.
 * @throws {HumanRefusal} For a turn that does not start at a finite film second, at least 0, or does not end at a finite second after its start.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the fixed partner, seeded input, eye height in metres and request order.
 * @evidence contracts/development/design.md#principled-representation Pure function of the turns and the stream, over the Gaze family's layer request.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader, `AutoMovieMotionHumanConversation.gaze`; the cadence is `HumanConversation`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the family's request type; no consumer is special-cased.
 * @evidence contracts/development/implementation.md#principled-implementation Applies the documented role cadence to the same partner on every turn.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Supplies fixed-partner selection to the shared glance planner with finite, nonnegative turn starts and finite ends after their starts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses film seconds and the shared documented means for every participant.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in spans and emitted requests with no per-turn index.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares cadence and aversion between dyadic and group planning.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the returned requests outlive the call.
 */
export function conversationGaze(
  params: IAutoMovieMotionHumanConversation.IGaze,
): IAutoMovieMotionHumanConversation.IGlances {
  return HumanConversation.glances(
    params.subject,
    params.turns,
    params.random,
    params.eyes,
    (turn: IAutoMovieMotionHumanConversation.ITurn): string => {
      HumanBound.least("turns.from", turn.from, 0, "s");
      HumanBound.above("turns.to", turn.to, turn.from, "s");
      return params.partner;
    },
  );
}
