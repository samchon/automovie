import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 8, 105–120 s: B's jab, cross, uppercut, body hook and low kick meet
 * A's parry, cover, joined gloves, elbow and check; A punishes with the
 * liver hook, a hook B covers and the cross that lands; A clinches for one
 * knee and releases while the referee closes; B's jab feint raises A's glove
 * and his body shot meets A's elbow; A's jab and cross meet B's slip and
 * cover.
 *
 * Concretization: A's punishment follows B's kick without a reset because
 * the screenplay has A use B's lingering beat.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s08 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s08-b01 A weathers the pressure.
 * @evidence docs/body/screenplay/kickboxing.md#s08-b02 A punishes the beat.
 * @evidence docs/body/screenplay/kickboxing.md#s08-b03 A's clinch knee.
 * @evidence docs/body/screenplay/kickboxing.md#s08-b04 B regroups.
 */
export function aWeathersIt(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(15, [
    RingPhase.reset([b, "press"], [a, "give"]),
    then(
      exchange(cast, "s08-b01", b.jab().cross().uppercut().bodyHook().lowKick(), a.parry().cover().cover().elbowBlock().check()),
      exchange(cast, "s08-b02", a.bodyHook().hook().cross(), b.take().cover().take(), false),
    ),
    RingPhase.reset([b, "give"], [a, "press"]),
    exchange(cast, "s08-b03", a.clinchKnee(), b.take()),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    then(exchange(cast, "s08-b04", b.feintJab().bodyCross(), a.tell("feint-jab").elbowBlock()), exchange(cast, "s08-b04c", a.jab().cross(), b.slip().cover(), false)),
  ]);
}
