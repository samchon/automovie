import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 8, 105 to 120 s: both step back to range with their guards up, then
 * B cuts A off toward the ropes and steps in with an unfeinted cross, body
 * hook and low kick into A's cover, elbow and early check; A punishes the
 * lingering beat with the liver hook, which B's right elbow, guarding the
 * side hurt at 20 s, now stops, and the cross over it lands; B gives ground
 * and A follows,
 * clinches for one knee and releases while the referee closes; they circle
 * apart and A hops through southpaw and back in place, and A shows the drag
 * feint, B checks it and covers A's jab; they circle, B's jab feint leaves
 * A's glove home and his body shot meets A's elbow, and A's pump jab and
 * cross meet B's chasing glove and cover.
 *
 * Concretization: A's punishment follows B's kick without a stretch between
 * them because the screenplay has A use B's lingering beat; B's check of the
 * drag feint is the low kick's drawn answer, not a habit, and A ignores B's
 * pump jab, the outcome table's feint ignored. Both stepping back to range
 * opens the scene before B's cut-off, one press stretch that walks A back toward the ropes
 * before B steps in. A's switch hop is two whole steps after the circling
 * stretch, before his drag feint. Pump jabs are feints, not strikes, so each
 * fighter throws at the elite rate.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s08 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s08-b01 A weathers the pressure.
 * @evidence docs/body/screenplay/kickboxing.md#s08-b02 A punishes the beat.
 * @evidence docs/body/screenplay/kickboxing.md#s08-b03 A's clinch knee.
 * @evidence docs/body/screenplay/kickboxing.md#s08-b03a A's switch hop, drag feint and jab.
 * @evidence docs/body/screenplay/kickboxing.md#s08-b04 B regroups.
 */
export function aWeathersIt(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(15, [
    RingPhase.reset([a, "separate"], [b, "separate"]),
    RingPhase.reset([b, "press"], [a, "give"]),
    then(
      exchange(
        cast,
        "s08-b01",
        b.cross().bodyHook().lowKick(),
        a.cover().elbowBlock().check(),
      ),
      exchange(cast, "s08-b02", a.bodyHook().cross(), b.elbowBlock().take()),
    ),
    RingPhase.reset([b, "give"], [a, "press"]),
    exchange(cast, "s08-b03", a.clinchKnee(), b.take()),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      a.move("switch", 2),
      exchange(cast, "s08-b03a", a.feintLowKick().jab(), b.check().cover()),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(
      exchange(
        cast,
        "s08-b04",
        b.feintJab().bodyCross(),
        a.take().elbowBlock(),
      ),
      exchange(
        cast,
        "s08-b04c",
        a.feintJab().cross(),
        b.tell("feint-jab").cover(),
      ),
    ),
  ]);
}
