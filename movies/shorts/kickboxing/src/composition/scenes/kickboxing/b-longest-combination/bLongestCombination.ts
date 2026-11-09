import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 7, 90 to 105 s: the pair circles and B steps in with his longest
 * combination, pump jab, cross, liver hook and low kick; A ignores the pump
 * jab, parries, takes the hook on his elbow and checks early, and off the
 * check throws his own pump jab and cross. This once B reads it: his right
 * glove stays home, he slips the cross, and his hook from the slip lands
 * and his cross meets A's tight cover; A pivots away off the ropes while B
 * circles after him, and his teep stops B while the referee walks around to
 * keep his view; both drift to a stand-off in the centre, B hops through
 * southpaw and back to orthodox in place and comes in kick first, a teep
 * that A parries; B presses with pump jab, cross and body kick into A's
 * steady guard and elbow, and A's cross meets B's slip as A circles toward
 * his lead side.
 *
 * Concretization: B's hook comes straight from the slip, so the two beats
 * form one sequence without a stretch between them; A's pivot away is the
 * stretch before the teep; B's switch hop is two whole steps after the
 * centre stand-off, before his teep. A ignores B's pump jabs, the outcome
 * table's feint ignored, and B, for this one exchange, ignores A's.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s07 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s07-b01 B's longest combination.
 * @evidence docs/body/screenplay/kickboxing.md#s07-b02 The hook from the slip.
 * @evidence docs/body/screenplay/kickboxing.md#s07-b03 A resets with the teep.
 * @evidence docs/body/screenplay/kickboxing.md#s07-b03a The centre stand-off and B's kick-first teep.
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
        b.feintJab().cross().bodyHook().lowKick(),
        a.take().parry().elbowBlock().check(),
      ),
      exchange(cast, "s07-b01c", a.feintJab().cross(), b.take().slip()),
      exchange(cast, "s07-b02", b.hook().cross(), a.take().cover()),
    ),
    RingPhase.reset([a, "pivot"], [b, "circle"]),
    exchange(cast, "s07-b03", a.teep(), b.take()),
    RingPhase.reset([a, "centre"], [b, "centre"]),
    then(
      b.move("switch", 2),
      exchange(cast, "s07-b03a", b.teep(), a.parry()),
    ),
    RingPhase.reset([b, "press"], [a, "give"]),
    then(
      exchange(
        cast,
        "s07-b04",
        b.feintJab().cross().bodyKick(),
        a.take().cover().elbowBlock(),
      ),
      exchange(cast, "s07-b04c", a.cross(), b.slip()),
    ),
  ]);
}
