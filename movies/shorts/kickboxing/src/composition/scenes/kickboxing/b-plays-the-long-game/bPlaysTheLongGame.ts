import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 3, 30 to 45 s: B's drag feint draws A's check and the real low kick
 * lands on the replanted leg; A circles away and B cuts him off, stepping in
 * with pump jab, cross, hook and low kick into A's chasing glove, cover, roll
 * and check, and A's cross straight off the check meets B's guard; A takes
 * the centre while B steps back to range, and from the stand-off B's double
 * jab on two short steps meets A's cover; A
 * presses and his pump jab draws B's glove before the jab finds B's nose; B
 * gives ground out of range while A circles, and comes back with the jab
 * feint, and the body hook lands under A's raised glove; they circle and A's
 * shoulder feint draws B's parry before his low kick meets B's check, and
 * B's cross from the check meets A's slip.
 *
 * Concretization: B's step out of range before his jab feint is his give
 * against A's circle; the cut-off before B's four is B's press against A's
 * give, mirroring A's escape toward his lead side; the answers to pump jabs
 * and the shoulder feint are the fighters' settings habits for arm feints. A
 * pump jab opening a combination is a feint, not a strike, so the
 * combination keeps its length at the elite thrown rate.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s03 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s03-b01 The drag feint and the real low kick.
 * @evidence docs/body/screenplay/kickboxing.md#s03-b02 The cut-off; B's four and A's check.
 * @evidence docs/body/screenplay/kickboxing.md#s03-b02a The centre stand-off and B's double jab.
 * @evidence docs/body/screenplay/kickboxing.md#s03-b03 The pump jab and the jab to the nose.
 * @evidence docs/body/screenplay/kickboxing.md#s03-b04 The feint and the body hook.
 * @evidence docs/body/screenplay/kickboxing.md#s03-b05 Shoulder feint, check and counter.
 */
export function bPlaysTheLongGame(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(15, [
    exchange(
      cast,
      "s03-b01",
      b.feintLowKick().lowKick(),
      a.tell("feint-low-kick").take(),
    ),
    RingPhase.reset([b, "press"], [a, "give"]),
    then(
      exchange(
        cast,
        "s03-b02",
        b.feintJab().cross().hook().lowKick(),
        a.tell("feint-jab").cover().roll().check(),
      ),
      exchange(cast, "s03-b02c", a.cross(), b.cover()),
    ),
    RingPhase.reset([a, "centre"], [b, "separate"]),
    exchange(cast, "s03-b02a", b.jab().jab(), a.cover().cover()),
    RingPhase.reset([a, "press"], [b, "give"]),
    exchange(cast, "s03-b03", a.feintJab().jab(), b.tell("feint-jab").take()),
    RingPhase.reset([b, "give"], [a, "circle"]),
    exchange(
      cast,
      "s03-b04",
      b.feintJab().bodyHook(),
      a.tell("feint-jab").take(),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      exchange(
        cast,
        "s03-b05",
        a.feintShoulder().lowKick(),
        b.tell("feint-shoulder").check(),
      ),
      exchange(cast, "s03-b05c", b.cross(), a.slip()),
    ),
  ]);
}
