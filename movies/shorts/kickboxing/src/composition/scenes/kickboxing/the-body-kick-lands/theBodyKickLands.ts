import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 5, 60–75 s: A changes the angle and his jab and cross draw B's guard
 * high so the body kick lands; B's switch kick, jab and cross meet A's
 * elbow, slip and parry and A's hook meets B's glove; A repeats the pattern
 * and B now drops his left arm onto the kick; B's jab, body cross and hook
 * meet A's cover, elbow and roll and A's cross meets B's slip.
 *
 * Concretization: A's change of angle is a pivot; B's answer to the second
 * body kick is his settings habit rather than a chosen block.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s05 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s05-b01 The body kick lands.
 * @evidence docs/body/screenplay/kickboxing.md#s05-b02 The switch kick and the answers.
 * @evidence docs/body/screenplay/kickboxing.md#s05-b03 The pattern repeats; B's arm drops.
 * @evidence docs/body/screenplay/kickboxing.md#s05-b04 B answers.
 */
export function theBodyKickLands(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(15, [
    RingPhase.reset([a, "pivot"]),
    exchange(
      cast,
      "s05-b01",
      a.jab().cross().bodyKick(),
      b.cover().cover().take(),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      exchange(
        cast,
        "s05-b02",
        b.switchKick().jab().cross(),
        a.elbowBlock().slip().parry(),
      ),
      exchange(cast, "s05-b02c", a.hook(), b.cover()),
    ),
    RingPhase.reset([a, "circle"]),
    exchange(
      cast,
      "s05-b03",
      a.jab().cross().bodyKick(),
      b.cover().cover().next(b.tell("body-kick")),
    ),
    RingPhase.reset([b, "circle"]),
    then(
      exchange(
        cast,
        "s05-b04",
        b.jab().bodyCross().hook(),
        a.cover().elbowBlock().roll(),
      ),
      exchange(cast, "s05-b04c", a.cross(), b.slip()),
    ),
  ]);
}
