import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 1, 0 to 15 s: the bell, the referee's start and the glove touch,
 * then the first exchanges in which both men read each other while the ring
 * turns. They circle toward their lead sides; A's pump jab draws B's glove
 * and B's teep resets the range; A cuts across and steps in with jab, cross
 * and hook into B's parry, cover and roll, and B's counter hook and cross
 * meet A's roll and sway; they circle and B shows the drag feint that A
 * checks at once, then steps in with jab and low kick into A's cover and
 * check, and A counters from the check; they circle and B hops through
 * southpaw and back in place, and B's jab feint and jab meet A's read and
 * slip, and A's body shot meets B's elbows.
 *
 * Concretization: the screenplay leaves the share of each stretch open; the
 * phase gives every stretch the same whole steps. The circling stretches
 * move both men toward their lead sides so the line keeps turning; the
 * stretch before A's first combination is A's cut-off (press) against B's
 * give; B's switch hop is the two whole steps that close the last stretch,
 * so both men still circle through it; and each
 * exchange closes the distance on its own entries and leaves on its exit as
 * the screenplay writes.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s01 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s01-b01 The bell and "Fight!".
 * @evidence docs/body/screenplay/kickboxing.md#s01-b02 The glove touch at 1.000, back at kicking distance by 1.550.
 * @evidence docs/body/screenplay/kickboxing.md#s01-b03 Circling; pump jab read; teep lands.
 * @evidence docs/body/screenplay/kickboxing.md#s01-b04 The cut-off; A's three against parry, cover, roll; B's counter against roll and sway.
 * @evidence docs/body/screenplay/kickboxing.md#s01-b05 B's drag feint, jab and low kick against check, cover and check; A's counter.
 * @evidence docs/body/screenplay/kickboxing.md#s01-b06 B's switch hop, jab feint and jab; A's body shot on B's elbows.
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
        a.jab().cross().hook(),
        b.parry().cover().roll(),
      ),
      exchange(cast, "s01-b04c", b.hook().cross(), a.roll().sway()),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      exchange(
        cast,
        "s01-b05",
        b.feintLowKick().jab().lowKick(),
        a.tell("feint-low-kick").cover().check(),
      ),
      exchange(cast, "s01-b05c", a.jab().cross(), b.parry().slip()),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      b.move("switch", 2),
      exchange(cast, "s01-b06", b.feintJab().jab(), a.tell("feint-jab").slip()),
      exchange(cast, "s01-b06c", a.bodyCross(), b.elbowBlock()),
    ),
  ]);
}
