import type { IAutoMovieMotionHumanConversation } from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { HumanConversation } from "./HumanConversation";

/**
 * Plan a participant's gaze from authored turns in a group conversation.
 *
 * At each turn start the listeners look toward the speaker and the speaker
 * looks toward the authored addressee. Auer (2018, doi:10.1075/ais.10.09aue)
 * observed speakers selecting addressees with gaze in three-party interaction.
 * Holler and Kendrick (2015, doi:10.3389/fpsyg.2015.00098) observed unaddressed
 * listeners shifting to the incoming speaker in questions and replies. Here
 * each change starts on the authored boundary. Consecutive spans with one
 * speaker can redirect their address.
 *
 * @param params The participant, the distinct nonempty subject ids including
 *   silent listeners, the ordered non-overlapping speaking spans in film
 *   seconds, the participant's seeded stream and the eye height in metres.
 * @returns Requests for HumanGaze.layer. The last request of each span releases
 *   at its end.
 * @throws When a subject, span, or eye height falls outside the stated bounds.
 */
export function conversationGroupGaze(
  params: IAutoMovieMotionHumanConversation.IGroupGaze,
): IAutoMovieMotionHumanConversation.IGlances {
  const { subject, participants, turns, random, eyes } = params;
  const roster: Set<string> = new Set(participants);
  if (roster.size !== participants.length || roster.has(""))
    throw new RangeError(
      "conversation participants must be distinct, nonempty subject IDs",
    );
  if (!roster.has(subject))
    throw new RangeError(
      `conversation subject ${subject} is outside the participant roster`,
    );
  HumanBound.above("eyes", eyes, 0, "m");

  let previousEnd: number = 0;
  for (const turn of turns) {
    if (!roster.has(turn.speaker) || !roster.has(turn.addressee))
      throw new RangeError(
        "conversation speaker and addressee must belong to the participant roster",
      );
    if (turn.speaker === turn.addressee)
      throw new RangeError("conversation speaker and addressee must differ");
    HumanBound.least("turns.from", turn.from, previousEnd, "s");
    previousEnd = HumanBound.above("turns.to", turn.to, turn.from, "s");
  }

  return HumanConversation.glances(
    subject,
    turns,
    random,
    eyes,
    (turn: IAutoMovieMotionHumanConversation.IGroupTurn): string =>
      turn.speaker === subject ? turn.addressee : turn.speaker,
    true,
  );
}
