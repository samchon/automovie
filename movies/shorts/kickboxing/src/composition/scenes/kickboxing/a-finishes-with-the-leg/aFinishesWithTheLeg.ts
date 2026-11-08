import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 2, 15–30 s: A slips B's jab and lands his own; A's jab, cross and
 * hook load B's lead leg and the low kick lands; A parries and slips B's jab
 * and cross and lands the liver hook; A sweeps B's teep and slips his jab;
 * A's pump jab draws B's glove and his body shot meets B's elbows.
 *
 * Concretization: between beats the pair circles, then B gives ground on the
 * diagonal while A cuts across, as the beats' space says; the counters step in on
 * their first strike.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s02 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s02-b01 Slip and counter jab.
 * @evidence docs/body/screenplay/kickboxing.md#s02-b02 The low kick behind the hook.
 * @evidence docs/body/screenplay/kickboxing.md#s02-b03 The liver hook.
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
    RingPhase.reset([a, "circle"], [b, "circle"]),
    exchange(
      cast,
      "s02-b02",
      a.jab().cross().hook().lowKick(),
      b.parry().cover().cover().take(),
    ),
    RingPhase.reset([b, "give"], [a, "press"]),
    then(
      exchange(cast, "s02-b03", b.jab().cross(), a.parry().slip()),
      exchange(cast, "s02-b03c", a.bodyHook(), b.take()),
    ),
    RingPhase.reset([a, "circle"]),
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
