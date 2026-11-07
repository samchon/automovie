import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 1, 0–15 s: the bell, the referee's start and the glove touch, then
 * the first exchanges in which both men read each other. A's pump jab draws
 * B's glove and B's teep resets the range; A's jab, cross and hook meet B's
 * parry, cover and roll and B's counter hook and cross meet A's roll and
 * sway; B's jab and low kick meet A's cover and check and A counters from
 * the check; B's jab feint and jab meet A's read and slip and A's body shot
 * meets B's elbows. They circle between exchanges.
 *
 * Concretization: the screenplay leaves the order of the resets' movements
 * open; each reset circles toward the movers' lead sides, and the teep and
 * every counter are thrown from where the previous exchange left the
 * fighters, without a step-in.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s01 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s01-b01 The bell and "Fight!".
 * @evidence docs/body/screenplay/kickboxing.md#s01-b02 The glove touch at 1.000, back at kicking distance by 1.550.
 * @evidence docs/body/screenplay/kickboxing.md#s01-b03 Pump jab read; teep lands.
 * @evidence docs/body/screenplay/kickboxing.md#s01-b04 A's three against parry, cover, roll; B's counter against roll and sway.
 * @evidence docs/body/screenplay/kickboxing.md#s01-b05 B's jab and low kick against cover and check; A's counter.
 * @evidence docs/body/screenplay/kickboxing.md#s01-b06 B's jab feint and jab; A's body shot on B's elbows.
 */
export function readingEachOther(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(15, [
    AutoMovieComposition.parallel(
      cast.bell.ring("bell-open"),
      cast.referee.signal("fight", 1, "Fight!"),
      a.touch(1, 1.55),
      b.touch(1, 1.55),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(exchange(cast, "s01-b03", a.feintJab(), b.tell("feint-jab")), exchange(cast, "s01-b03c", b.teep(), a.take(), false)),
    RingPhase.reset([a, "circle"]),
    then(exchange(cast, "s01-b04", a.jab().cross().hook(), b.parry().cover().roll()), exchange(cast, "s01-b04c", b.hook().cross(), a.roll().sway(), false)),
    RingPhase.reset([b, "circle"]),
    then(exchange(cast, "s01-b05", b.jab().lowKick(), a.cover().check()), exchange(cast, "s01-b05c", a.jab().cross(), b.parry().slip(), false)),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(exchange(cast, "s01-b06", b.feintJab().jab(), a.tell("feint-jab").slip()), exchange(cast, "s01-b06c", a.bodyCross(), b.elbowBlock(), false)),
  ]);
}
