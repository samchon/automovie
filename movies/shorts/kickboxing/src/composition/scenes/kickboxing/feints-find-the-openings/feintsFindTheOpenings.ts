import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 6, 75 to 90 s: A's pump jab and low-kick feint put B on one leg and
 * the cross lands; B hops back and cuts out along the ropes, then comes
 * back with a shoulder feint that raises A's parry and a cross, hook and
 * high kick that A slips, rolls and blocks high; A circles away and comes back
 * with a double jab into B's cover; they circle and A's teep lands, B walks
 * through it behind a level change that drops A's elbow and a jab that A
 * slips, and
 * A's body shot lands; they circle and B's body-kick feint draws A's elbow
 * before his low kick meets A's check, and off the check A's level change
 * drops B's elbow and his jab lands.
 *
 * Concretization: B's way off the ropes is his escape while A gives ground
 * on the diagonal; B's step back in after the teep is his jab's own entry;
 * A's elbow on B's body-kick feint is the shown kick's drawn answer, not a
 * habit; B's answer to A's pump jab and A's to B's shoulder and level
 * feints are their habits.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s06 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s06-b01 Two feints, one cross.
 * @evidence docs/body/screenplay/kickboxing.md#s06-b02 B's high kick blocked.
 * @evidence docs/body/screenplay/kickboxing.md#s06-b02a A's double jab.
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
    RingPhase.reset([b, "escape"], [a, "give"]),
    exchange(
      cast,
      "s06-b02",
      b.feintShoulder().cross().hook().highKick(),
      a.tell("feint-shoulder").slip().roll().highBlock(),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    exchange(cast, "s06-b02a", a.jab().jab(), b.cover().cover()),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      exchange(cast, "s06-b03", a.teep(), b.take()),
      exchange(
        cast,
        "s06-b03c",
        b.feintLevel().jab(),
        a.tell("feint-level").slip(),
      ),
      exchange(cast, "s06-b03c2", a.bodyCross(), b.take()),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      exchange(
        cast,
        "s06-b04",
        b.feintBodyKick().lowKick(),
        a.elbowBlock().check(),
      ),
      exchange(
        cast,
        "s06-b04c",
        a.feintLevel().jab(),
        b.tell("feint-level").take(),
      ),
    ),
  ]);
}
