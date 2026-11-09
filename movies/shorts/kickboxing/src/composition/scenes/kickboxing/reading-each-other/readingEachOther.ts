import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 1, 0 to 15 s: the bell, the referee's start and the glove touch,
 * then the first exchanges in which both men read each other while the ring
 * turns. They circle toward their lead sides; A's pump jab draws B's glove
 * and B's teep resets the range; A cuts across and steps in with pump jab,
 * cross and hook into B's chasing glove, cover and roll, and B's counter
 * hook meets A's roll; they circle and B shows the drag feint that A
 * checks at once, then steps in with jab and low kick into A's cover and
 * check, and A's cross off the check meets B's slip; they circle and B hops through
 * southpaw and back in place, and B's jab feint and jab meet A's read and
 * slip, and A's slip-counter, a right straight to the body, meets B's
 * elbows.
 *
 * Concretization: the screenplay leaves the share of each stretch open; the
 * phase gives every stretch the same whole steps. The circling stretches
 * move both men toward their lead sides so the line keeps turning; the
 * stretch before A's first combination is A's cut-off (press) against B's
 * give; B's switch hop is the two whole steps that close the last stretch,
 * so both men still circle through it; and each
 * exchange closes the distance on its own entries and leaves on its exit as
 * the screenplay writes. A pump jab opening a combination is a feint, not a
 * strike, so the combination keeps its length at the elite thrown rate.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s01 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s01-b01 The bell and "Fight!".
 * @evidence docs/body/screenplay/kickboxing.md#s01-b02 The glove touch at 1.000, back at kicking distance by 1.550.
 * @evidence docs/body/screenplay/kickboxing.md#s01-b03 Circling; pump jab read; teep lands.
 * @evidence docs/body/screenplay/kickboxing.md#s01-b04 The cut-off; A's pump jab, cross and hook against read, cover, roll; B's hook against the roll.
 * @evidence docs/body/screenplay/kickboxing.md#s01-b05 B's drag feint, jab and low kick against check, cover and check; A's cross off the check.
 * @evidence docs/body/screenplay/kickboxing.md#s01-b06 B's switch hop, jab feint and jab; A's slip-counter to the body on B's elbows.
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
    then(
      exchange(cast, "s01-b03", a.feintJab(), b.tell("feint-jab")),
      exchange(cast, "s01-b03c", b.teep(), a.take()),
    ),
    RingPhase.reset([a, "press"], [b, "give"]),
    then(
      exchange(
        cast,
        "s01-b04",
        a.feintJab().cross().hook(),
        b.tell("feint-jab").cover().roll(),
      ),
      exchange(cast, "s01-b04c", b.hook(), a.roll()),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      exchange(
        cast,
        "s01-b05",
        b.feintLowKick().jab().lowKick(),
        a.tell("feint-low-kick").cover().check(),
      ),
      exchange(cast, "s01-b05c", a.cross(), b.slip()),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      b.move("switch", 2),
      exchange(cast, "s01-b06", b.feintJab().jab(), a.tell("feint-jab").slip()),
      exchange(cast, "s01-b06c", a.bodyCross(), b.elbowBlock()),
    ),
  ]);
}
