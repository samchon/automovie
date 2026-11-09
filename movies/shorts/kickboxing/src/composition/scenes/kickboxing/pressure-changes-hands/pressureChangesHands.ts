import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 4, 45 to 60 s: B walks to the centre while A gives ground, and his
 * double jab drives A toward the ropes into his gloves; A parries, slips and
 * rolls B's three and lands the uppercut from the roll; A circles off the
 * ropes, shows the pump jab and pushes a teep that B parries; B presses back,
 * clinches for one knee and releases while the referee closes; A pivots off
 * the line with B circling after him; B's shoulder feint raises A's parry
 * and his chasing cross meets A's cover, and A lands the pivot hook; A
 * circles and steps in with jab, cross and body hook into B's guard and the
 * low kick lands.
 *
 * Concretization: A's way off the ropes before his teep is his escape
 * toward the open side; the pivot before B's chase is A's pivot reset; A's
 * parry of the shoulder feint is his settings habit for arm feints.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s04 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s04-b01 B takes the centre.
 * @evidence docs/body/screenplay/kickboxing.md#s04-b02 The uppercut from the roll.
 * @evidence docs/body/screenplay/kickboxing.md#s04-b02a A escapes the ropes behind pump jab and teep.
 * @evidence docs/body/screenplay/kickboxing.md#s04-b03 The clinch knee.
 * @evidence docs/body/screenplay/kickboxing.md#s04-b04 The pivot hook.
 * @evidence docs/body/screenplay/kickboxing.md#s04-b05 The low kick again.
 */
export function pressureChangesHands(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(15, [
    RingPhase.reset([b, "centre"], [a, "give"]),
    exchange(cast, "s04-b01", b.jab().jab(), a.cover().cover()),
    RingPhase.reset([b, "press"], [a, "give"]),
    then(
      exchange(
        cast,
        "s04-b02",
        b.jab().cross().hook(),
        a.parry().slip().roll(),
      ),
      exchange(cast, "s04-b02c", a.uppercut(), b.take()),
    ),
    RingPhase.reset([a, "escape"]),
    exchange(
      cast,
      "s04-b02a",
      a.feintJab().teep(),
      b.tell("feint-jab").parry(),
    ),
    RingPhase.reset([b, "press"], [a, "give"]),
    exchange(cast, "s04-b03", b.clinchKnee(), a.take()),
    RingPhase.reset([a, "pivot"], [b, "circle"]),
    then(
      exchange(
        cast,
        "s04-b04",
        b.feintShoulder().cross(),
        a.tell("feint-shoulder").cover(),
      ),
      exchange(cast, "s04-b04c", a.hook(), b.take()),
    ),
    RingPhase.reset([a, "circle"], [b, "circle"]),
    exchange(
      cast,
      "s04-b05",
      a.jab().cross().bodyHook().lowKick(),
      b.cover().cover().elbowBlock().take(),
    ),
  ]);
}
