import type { IAutoMovieMotionHumanConversation } from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { HumanConversation } from "./HumanConversation";

/*
 * A participant's gaze requests through a conversation with one partner: the
 * glance model of HumanConversation (Acarturk et al. 2021, Table 3 and
 * Table 5) applied to the same partner on every turn.
 * Parameter params: The participant, the partner's subject id, the turns in time
 * order, the participant's stream and the eye height in metres.
 * Returns: Gaze layer requests in time order.
 * For a turn that does not start at a finite film
 * second, at least 0, or does not end at a finite second after its start.
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
