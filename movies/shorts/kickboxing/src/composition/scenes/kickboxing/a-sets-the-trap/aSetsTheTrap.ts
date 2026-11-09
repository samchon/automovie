import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 9, 120 to 135 s: A walks B down and his jab and body-kick feint drop
 * B's left arm, and the cross over it lands; they circle and B's shoulder
 * feint draws A's parry before his three meet A's parry, slip and roll and
 * A's cross meets B's guard; B circles in and
 * changes level as if to go to the body, A's elbow drops and B's cross
 * meets A's slip; both circle and A's
 * jab, cross and body kick meet B's guard and his dropped arm; B's drag feint
 * draws A's check and the cross lands, and A's jab and cross meet B's parry
 * and slip.
 *
 * Concretization: B's answers to A's rising right knee and A's answers to
 * B's feints are their settings habits, not chosen blocks.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s09 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s09-b01 The trap is shown.
 * @evidence docs/body/screenplay/kickboxing.md#s09-b02 B's shoulder feint and three.
 * @evidence docs/body/screenplay/kickboxing.md#s09-b02a B's level change and cross.
 * @evidence docs/body/screenplay/kickboxing.md#s09-b03 The tell again.
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
      a.jab().feintBodyKick().cross(),
      b.cover().next(b.tell("feint-body-kick")).take(),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      exchange(
        cast,
        "s09-b02",
        b.feintShoulder().jab().cross().hook(),
        a.tell("feint-shoulder").parry().slip().roll(),
      ),
      exchange(cast, "s09-b02c", a.cross(), b.cover()),
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
      a.jab().cross().bodyKick(),
      b.cover().cover().next(b.tell("body-kick")),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      exchange(
        cast,
        "s09-b04",
        b.feintLowKick().cross(),
        a.tell("feint-low-kick").take(),
      ),
      exchange(cast, "s09-b04c", a.jab().cross(), b.parry().slip()),
    ),
  ]);
}
