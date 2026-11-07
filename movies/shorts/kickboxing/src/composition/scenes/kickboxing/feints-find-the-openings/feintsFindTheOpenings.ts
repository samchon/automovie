import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 6, 75–90 s: A's pump jab and low-kick feint put B on one leg and the
 * cross lands; B's jab, cross, hook and high kick meet A's parry, slip, roll
 * and high block; A's teep lands, B's jab meets A's slip and A's body shot
 * lands; B's jab and low kick meet A's cover and check, A's jab lands and
 * his cross meets B's gloves.
 *
 * Concretization: B presses after his rebalancing hop while A gives ground;
 * B steps back in for his jab after the teep.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s06 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s06-b01 Two feints, one cross.
 * @evidence docs/body/screenplay/kickboxing.md#s06-b02 B's high kick blocked.
 * @evidence docs/body/screenplay/kickboxing.md#s06-b03 Teep, slip, body shot.
 * @evidence docs/body/screenplay/kickboxing.md#s06-b04 Check and land.
 */
export function feintsFindTheOpenings(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(15, [
    exchange(cast, "s06-b01", a.feintJab().feintLowKick().cross(), b.tell("feint-jab").check().take()),
    RingPhase.reset([b, "press"], [a, "give"]),
    exchange(cast, "s06-b02", b.jab().cross().hook().highKick(), a.parry().slip().roll().highBlock()),
    RingPhase.reset([a, "give"]),
    then(exchange(cast, "s06-b03", a.teep(), b.take()), exchange(cast, "s06-b03b", b.jab(), a.slip()), exchange(cast, "s06-b03c", a.bodyCross(), b.take())),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(exchange(cast, "s06-b04", b.jab().lowKick(), a.cover().check()), exchange(cast, "s06-b04c", a.jab().cross(), b.take().cover())),
  ]);
}
