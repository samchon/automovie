import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 2, 15 to 30 s: A slips B's stepping jab and lands his own; the pair
 * circles and A cuts across, then steps in behind jab, cross and hook that
 * load B's lead leg and the low kick lands; B's level change draws A's elbow
 * and he steps back in with jab and cross that A parries and slips, and the
 * liver hook lands; both circle and A shows the drag feint, B lifts the
 * check and A's cross meets his guard; B
 * gives ground and pushes a teep that A sweeps aside, and A slips the covering
 * jab; A presses B toward the ropes, his pump jab draws B's glove and his
 * body shot meets B's elbows.
 *
 * Concretization: the stretches between beats alternate A's cut-off
 * (press against give) with circling, as the beats' space writes; the stretch
 * after the liver hook is both men circling before A's drag feint. A's elbow
 * on B's level change is his settings habit for body-level arm feints.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s02 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s02-b01 Slip and counter jab.
 * @evidence docs/body/screenplay/kickboxing.md#s02-b02 The cut-off and the low kick behind the hook.
 * @evidence docs/body/screenplay/kickboxing.md#s02-b03 The level change read; the liver hook.
 * @evidence docs/body/screenplay/kickboxing.md#s02-b03a The drag feint and the cross into the guard.
 * @evidence docs/body/screenplay/kickboxing.md#s02-b04 The teep swept aside, the covering jab slipped.
 * @evidence docs/body/screenplay/kickboxing.md#s02-b05 Pump jab and body shot.
 */
export function aFinishesWithTheLeg(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(15, [
    then(
      exchange(cast, "s02-b01", b.jab(), a.slip()),
      exchange(cast, "s02-b01c", a.jab(), b.take()),
    ),
    RingPhase.reset([a, "press"], [b, "give"]),
    exchange(
      cast,
      "s02-b02",
      a.jab().cross().hook().lowKick(),
      b.parry().cover().cover().take(),
    ),
    RingPhase.reset([b, "circle"], [a, "circle"]),
    then(
      exchange(
        cast,
        "s02-b03",
        b.feintLevel().jab().cross(),
        a.tell("feint-level").parry().slip(),
      ),
      exchange(cast, "s02-b03c", a.bodyHook(), b.take()),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    exchange(cast, "s02-b03a", a.feintLowKick().cross(), b.check().cover()),
    RingPhase.reset([b, "give"], [a, "circle"]),
    then(
      exchange(cast, "s02-b04", b.teep(), a.parry()),
      exchange(cast, "s02-b04c", b.jab(), a.slip()),
    ),
    RingPhase.reset([a, "press"], [b, "give"]),
    exchange(
      cast,
      "s02-b05",
      a.feintJab().bodyCross(),
      b.tell("feint-jab").elbowBlock(),
    ),
  ]);
}
