import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 7, 90 to 105 s: the pair circles and B steps in with his longest
 * combination into A's cover, parry, elbow and check, and A's jab and cross
 * from the check meet B's two slips; B's hook from the slip lands and his
 * cross and hook meet A's tight cover; A pivots away off the ropes while B
 * circles after him, and his teep stops B while the referee walks around to
 * keep his view; they circle and B hops through southpaw and back to
 * orthodox in place, and B steps in behind a jab and a teep that A covers
 * and parries; B presses with jab, cross and body kick into A's guard and
 * elbow, and A's jab and cross meet B's parry and slip as A circles toward
 * his lead side.
 *
 * Concretization: B's hook comes straight from the second slip, so the two
 * beats form one sequence without a stretch between them; A's pivot away is
 * the stretch before the teep; B's switch hop is two whole steps after the
 * circling stretch, before his jab and teep.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s07 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s07-b01 B's longest combination.
 * @evidence docs/body/screenplay/kickboxing.md#s07-b02 The hook from the slip.
 * @evidence docs/body/screenplay/kickboxing.md#s07-b03 A resets with the teep.
 * @evidence docs/body/screenplay/kickboxing.md#s07-b03a B's jab and teep.
 * @evidence docs/body/screenplay/kickboxing.md#s07-b04 B's body kick.
 */
export function bLongestCombination(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(15, [
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      exchange(
        cast,
        "s07-b01",
        b.jab().cross().bodyHook().lowKick(),
        a.cover().parry().elbowBlock().check(),
      ),
      exchange(cast, "s07-b01c", a.jab().cross(), b.slip().slip()),
      exchange(
        cast,
        "s07-b02",
        b.hook().cross().hook(),
        a.take().cover().cover(),
      ),
    ),
    RingPhase.reset([a, "pivot"], [b, "circle"]),
    exchange(cast, "s07-b03", a.teep(), b.take()),
    RingPhase.reset([b, "circle"], [a, "circle"]),
    then(
      b.move("switch", 2),
      exchange(cast, "s07-b03a", b.jab().teep(), a.cover().parry()),
    ),
    RingPhase.reset([b, "press"], [a, "give"]),
    then(
      exchange(
        cast,
        "s07-b04",
        b.jab().cross().bodyKick(),
        a.cover().cover().elbowBlock(),
      ),
      exchange(cast, "s07-b04c", a.jab().cross(), b.parry().slip()),
    ),
  ]);
}
