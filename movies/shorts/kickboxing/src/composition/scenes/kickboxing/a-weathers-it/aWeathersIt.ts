import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 8, 105 to 120 s: both circle, then B cuts A off toward the ropes and
 * steps in with jab,
 * cross, uppercut, body hook and low kick into A's parry, cover, joined
 * gloves, elbow and check; A punishes the lingering beat with the liver
 * hook, a hook B covers and the cross that lands; B gives ground and A
 * follows, clinches for one knee and releases while the referee closes;
 * they circle apart and A hops through southpaw and back in place, and A shows
 * the drag feint, B checks it and covers A's jab; they
 * circle, B's jab feint raises A's glove and his body shot meets A's elbow,
 * and A's jab and cross meet B's slip and cover.
 *
 * Concretization: A's punishment follows B's kick without a stretch between
 * them because the screenplay has A use B's lingering beat; B's check of the
 * drag feint is the low kick's drawn answer, not a habit. The circling
 * stretch turns the line before B's cut-off, one press stretch that walks A
 * back toward the ropes before B steps in. A's switch hop is two whole steps after the
 * circling stretch, before his drag feint.
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
    RingPhase.reset([a, "circle"], [b, "circle"]),
    RingPhase.reset([b, "press"], [a, "give"]),
    then(
      exchange(
        cast,
        "s08-b01",
        b.jab().cross().uppercut().bodyHook().lowKick(),
        a.parry().cover().cover().elbowBlock().check(),
      ),
      exchange(
        cast,
        "s08-b02",
        a.bodyHook().hook().cross(),
        b.take().cover().take(),
      ),
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
        a.tell("feint-jab").elbowBlock(),
      ),
      exchange(cast, "s08-b04c", a.jab().cross(), b.slip().cover()),
    ),
  ]);
}
