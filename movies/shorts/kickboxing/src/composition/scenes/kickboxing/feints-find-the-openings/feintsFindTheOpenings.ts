import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 6, 75 to 90 s: A's pump jab and low-kick feint put B on one leg and
 * the cross lands; B hops back, then presses out of the rope zone with jab,
 * cross, hook and high kick into A's parry, slip, roll and high block; A
 * circles away and comes back with pump jab, jab and cross into B's parry,
 * parry and cover; they circle and A's teep lands, B walks through it
 * behind a jab that A slips and A's body shot lands; they circle and B's
 * body-kick feint draws A's elbow before his jab and low kick meet A's cover
 * and check, A's jab lands from the check and his cross meets B's gloves.
 *
 * Concretization: B presses after his rebalancing hop while A gives ground
 * on the diagonal; B's step back in after the teep is his jab's own entry;
 * A's elbow on B's body-kick feint is the shown kick's drawn answer, not a
 * habit.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s06 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s06-b01 Two feints, one cross.
 * @evidence docs/body/screenplay/kickboxing.md#s06-b02 B's high kick blocked.
 * @evidence docs/body/screenplay/kickboxing.md#s06-b02a A's pump jab, jab and cross.
 * @evidence docs/body/screenplay/kickboxing.md#s06-b03 Teep, slip, body shot.
 * @evidence docs/body/screenplay/kickboxing.md#s06-b04 B's body-kick feint; check and land.
 */
export function feintsFindTheOpenings(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(15, [
    exchange(
      cast,
      "s06-b01",
      a.feintJab().feintLowKick().cross(),
      b.tell("feint-jab").check().take(),
    ),
    RingPhase.reset([b, "press"], [a, "give"]),
    exchange(
      cast,
      "s06-b02",
      b.jab().cross().hook().highKick(),
      a.parry().slip().roll().highBlock(),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    exchange(
      cast,
      "s06-b02a",
      a.feintJab().jab().cross(),
      b.tell("feint-jab").parry().cover(),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      exchange(cast, "s06-b03", a.teep(), b.take()),
      exchange(cast, "s06-b03c", b.jab(), a.slip()),
      exchange(cast, "s06-b03c2", a.bodyCross(), b.take()),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      exchange(
        cast,
        "s06-b04",
        b.feintBodyKick().jab().lowKick(),
        a.elbowBlock().cover().check(),
      ),
      exchange(cast, "s06-b04c", a.jab().cross(), b.take().cover()),
    ),
  ]);
}
