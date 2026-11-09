import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 5, 60 to 75 s: A pivots to an outside angle while B circles, and
 * steps in with a cross that draws B's guard high, and the body kick lands;
 * the pair circles, B switches into his switch kick and follows with a
 * cross into A's elbow and parry, and A's hook from the parry meets B's
 * glove; both step back to range with their guards up, and B shows the
 * drag feint, A checks it at once and
 * covers the jab that follows; both circle and A repeats the pattern, and B
 * now drops his left arm onto the kick; they circle and B's shoulder feint
 * draws A's parry before his body cross and hook meet A's elbow and roll,
 * and A rises from the roll showing the body, B's elbow drops and A's cross
 * meets B's slip.
 *
 * Concretization: A's change of angle is a pivot; B's answers to A's rising
 * right knee is his settings habit rather than a chosen block, and A's
 * answers to the drag and shoulder feints are his own habits.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s05 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s05-b01 The body kick lands.
 * @evidence docs/body/screenplay/kickboxing.md#s05-b02 The switch kick and the answers.
 * @evidence docs/body/screenplay/kickboxing.md#s05-b02a B's drag feint and jab.
 * @evidence docs/body/screenplay/kickboxing.md#s05-b03 The pattern repeats; B's arm drops.
 * @evidence docs/body/screenplay/kickboxing.md#s05-b04 B's shoulder feint and answer.
 */
export function theBodyKickLands(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(15, [
    RingPhase.reset([a, "pivot"], [b, "circle"]),
    exchange(cast, "s05-b01", a.cross().bodyKick(), b.cover().take()),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      exchange(
        cast,
        "s05-b02",
        b.switchKick().cross(),
        a.elbowBlock().parry(),
      ),
      exchange(cast, "s05-b02c", a.hook(), b.cover()),
    ),
    RingPhase.reset([b, "separate"], [a, "separate"]),
    exchange(
      cast,
      "s05-b02a",
      b.feintLowKick().jab(),
      a.tell("feint-low-kick").cover(),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    exchange(
      cast,
      "s05-b03",
      a.cross().bodyKick(),
      b.cover().next(b.tell("body-kick")),
    ),
    RingPhase.reset([b, "circle"], [a, "circle"]),
    then(
      exchange(
        cast,
        "s05-b04",
        b.feintShoulder().bodyCross().hook(),
        a.tell("feint-shoulder").elbowBlock().roll(),
      ),
      exchange(
        cast,
        "s05-b04c",
        a.feintLevel().cross(),
        b.tell("feint-level").slip(),
      ),
    ),
  ]);
}
