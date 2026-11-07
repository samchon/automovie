import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 7, 90–105 s: B's longest combination meets A's cover, parry, elbow
 * and check and A's jab and cross meet B's two slips; B's hook from the slip
 * lands and his cross and hook meet A's tight cover; A pivots away and his
 * teep stops B while the referee walks around to keep his view; B's jab,
 * cross and body kick meet A's guard and elbow and A's jab and cross meet
 * B's parry and slip.
 *
 * Concretization: B's hook comes straight from the second slip, so the two
 * beats form one sequence without a reset; A's pivot away is the reset
 * before the teep.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s07 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s07-b01 B's longest combination.
 * @evidence docs/body/screenplay/kickboxing.md#s07-b02 The hook from the slip.
 * @evidence docs/body/screenplay/kickboxing.md#s07-b03 A resets with the teep.
 * @evidence docs/body/screenplay/kickboxing.md#s07-b04 B's body kick.
 */
export function bLongestCombination(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(15, [
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      exchange(cast, "s07-b01", b.jab().cross().bodyHook().lowKick(), a.cover().parry().elbowBlock().check()),
      exchange(cast, "s07-b01c", a.jab().cross(), b.slip().slip(), false),
      exchange(cast, "s07-b02", b.hook().cross().hook(), a.take().cover().cover(), false),
    ),
    RingPhase.reset([a, "pivot"]),
    exchange(cast, "s07-b03", a.teep(), b.take()),
    RingPhase.reset([b, "press"], [a, "give"]),
    then(exchange(cast, "s07-b04", b.jab().cross().bodyKick(), a.cover().cover().elbowBlock()), exchange(cast, "s07-b04c", a.jab().cross(), b.parry().slip(), false)),
  ]);
}
