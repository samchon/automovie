import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 2, 15 to 30 s: B steps in behind a double jab, A covers the first
 * and slips the second and lands his own; A cuts across, then steps in
 * behind pump jab, cross and hook that load B's lead leg and the low kick
 * lands; B's level change draws A's elbow and he steps back in with a cross
 * that A slips, and the liver hook lands; B covers and gives ground while A
 * follows; B comes back kick first, a low kick that A checks and a cross
 * into A's guard; B gives ground and pushes a teep that A sweeps aside; A presses B toward the ropes and steps in with
 * an unfeinted right straight to the body that meets B's elbows.
 *
 * Concretization: the stretches between beats alternate A's cut-off
 * (press against give) with circling, as the beats' space writes; the
 * stretch after the liver hook is B giving ground under A's press. A's elbow
 * on B's level change is his settings habit for body-level arm feints. A
 * pump jab opening a combination is a feint, not a strike, so the
 * combination keeps its length at the elite thrown rate.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s02 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s02-b01 B's double jab, cover and slip, counter jab.
 * @evidence docs/body/screenplay/kickboxing.md#s02-b02 The cut-off and the low kick behind the hook.
 * @evidence docs/body/screenplay/kickboxing.md#s02-b03 The level change read; the liver hook; B covers and gives ground.
 * @evidence docs/body/screenplay/kickboxing.md#s02-b03a B's kick-first entry: low kick checked, cross into the guard.
 * @evidence docs/body/screenplay/kickboxing.md#s02-b04 The teep swept aside.
 * @evidence docs/body/screenplay/kickboxing.md#s02-b05 The unfeinted body shot.
 */
export function aFinishesWithTheLeg(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(15, [
    then(
      exchange(cast, "s02-b01", b.jab().jab(), a.cover().slip()),
      exchange(cast, "s02-b01c", a.jab(), b.take()),
    ),
    RingPhase.reset([a, "press"], [b, "give"]),
    exchange(
      cast,
      "s02-b02",
      a.feintJab().cross().hook().lowKick(),
      b.tell("feint-jab").cover().cover().take(),
    ),
    RingPhase.reset([b, "circle"], [a, "circle"]),
    then(
      exchange(
        cast,
        "s02-b03",
        b.feintLevel().cross(),
        a.tell("feint-level").slip(),
      ),
      exchange(cast, "s02-b03c", a.bodyHook(), b.take()),
    ),
    RingPhase.reset([b, "give"], [a, "press"]),
    exchange(cast, "s02-b03a", b.lowKick().cross(), a.check().cover()),
    RingPhase.reset([b, "give"], [a, "circle"]),
    exchange(cast, "s02-b04", b.teep(), a.parry()),
    RingPhase.reset([a, "press"], [b, "give"]),
    exchange(cast, "s02-b05", a.bodyCross(), b.elbowBlock()),
  ]);
}
