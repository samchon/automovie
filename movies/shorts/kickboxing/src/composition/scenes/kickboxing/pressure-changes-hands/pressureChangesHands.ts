import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 4, 45–60 s: B takes the centre behind a double jab into A's gloves;
 * A parries, slips and rolls B's three and lands the uppercut; B clinches
 * for one knee and releases while the referee closes; A pivots off the line,
 * slips and covers B's jab and cross and lands the pivot hook; A's jab,
 * cross and body hook meet B's guard and the low kick lands.
 *
 * Concretization: B walks to the centre while A gives ground before the
 * double jab; A's pivot is the reset before B's chase.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s04 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s04-b01 B takes the centre.
 * @evidence docs/body/screenplay/kickboxing.md#s04-b02 The uppercut from the roll.
 * @evidence docs/body/screenplay/kickboxing.md#s04-b03 The clinch knee.
 * @evidence docs/body/screenplay/kickboxing.md#s04-b04 The pivot hook.
 * @evidence docs/body/screenplay/kickboxing.md#s04-b05 The low kick again.
 */
export function pressureChangesHands(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(15, [
    RingPhase.reset([b, "centre"], [a, "give"]),
    exchange(cast, "s04-b01", b.jab().jab(), a.cover().cover()),
    RingPhase.reset([a, "circle"]),
    then(exchange(cast, "s04-b02", b.jab().cross().hook(), a.parry().slip().roll()), exchange(cast, "s04-b02c", a.uppercut(), b.take())),
    RingPhase.reset([b, "press"], [a, "give"]),
    exchange(cast, "s04-b03", b.clinchKnee(), a.take()),
    RingPhase.reset([a, "pivot"]),
    then(exchange(cast, "s04-b04", b.jab().cross(), a.slip().cover()), exchange(cast, "s04-b04c", a.hook(), b.take())),
    RingPhase.reset([a, "circle"]),
    exchange(cast, "s04-b05", a.jab().cross().bodyHook().lowKick(), b.cover().cover().elbowBlock().take()),
  ]);
}
