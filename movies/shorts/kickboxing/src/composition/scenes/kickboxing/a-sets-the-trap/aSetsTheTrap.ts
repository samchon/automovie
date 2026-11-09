import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 9, 120 to 135 s: A walks B down and his pump jab and body-kick feint
 * raise B's right glove and drop his left arm, and the cross over it lands;
 * A pivots to a new angle as B circles, and B's shoulder feint draws A's
 * parry before his cross and
 * hook meet A's slip and roll, and A rises from the roll showing the body,
 * B's elbow drops and A's cross meets B's guard; B circles in and changes level as if to go to the
 * body, A's elbow drops and B's cross meets A's slip; both circle and A's
 * pump jab, cross and body kick meet B's chasing glove and guard, but B,
 * burned at 120, now keeps his left glove high, and the true body kick lands
 * under it; both stand still for a moment, reading; B's drag feint draws A's
 * check and the cross lands, and A's jab meets B's parry.
 *
 * Concretization: B's answers to the pump jab and A's answers to B's feints
 * are their settings habits, not chosen blocks; B's high block against the
 * body kick is his one adjustment, which the kick goes under. The still read
 * is a held guard of both men. Feints, not strikes, open the combinations, so each fighter throws
 * at the elite rate.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s09 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s09-b01 The trap is shown.
 * @evidence docs/body/screenplay/kickboxing.md#s09-b02 B's shoulder feint, cross and hook.
 * @evidence docs/body/screenplay/kickboxing.md#s09-b02a B's level change and cross.
 * @evidence docs/body/screenplay/kickboxing.md#s09-b03 B keeps his guard high and the body kick lands.
 * @evidence docs/body/screenplay/kickboxing.md#s09-b03a The still read.
 * @evidence docs/body/screenplay/kickboxing.md#s09-b04 B's drag and cross.
 */
export function aSetsTheTrap(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(15, [
    RingPhase.reset([a, "press"], [b, "give"]),
    exchange(
      cast,
      "s09-b01",
      a.feintJab().feintBodyKick().cross(),
      b.tell("feint-jab").next(b.tell("feint-body-kick")).take(),
    ),
    RingPhase.reset([a, "pivot"], [b, "circle"]),
    then(
      exchange(
        cast,
        "s09-b02",
        b.feintShoulder().cross().hook(),
        a.tell("feint-shoulder").slip().roll(),
      ),
      exchange(
        cast,
        "s09-b02c",
        a.feintLevel().cross(),
        b.tell("feint-level").cover(),
      ),
    ),
    RingPhase.reset([b, "circle"], [a, "circle"]),
    exchange(
      cast,
      "s09-b02a",
      b.feintLevel().cross(),
      a.tell("feint-level").slip(),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    exchange(
      cast,
      "s09-b03",
      a.feintJab().cross().bodyKick(),
      b.tell("feint-jab").cover().highBlock(),
    ),
    // The still read: both hold their guards and watch, the round's only
    // pause, before B's drag.
    AutoMovieComposition.parallel(
      a.phase("guard", STILL_READ),
      b.phase("guard", STILL_READ),
    ),
    then(
      exchange(
        cast,
        "s09-b04",
        b.feintLowKick().cross(),
        a.tell("feint-low-kick").take(),
      ),
      exchange(cast, "s09-b04c", a.jab(), b.parry()),
    ),
  ]);
}

/** The still read before scene 10, seconds: the round's one pause (screenplay, 2 to 3 s). */
const STILL_READ: number = 2.5;
