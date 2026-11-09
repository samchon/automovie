import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 10, 135 to 150 s: B steps in with his four into A's parry, slip,
 * roll and check and A's cross from the check lands; they circle, B's
 * covering jab meets A's slip and A's body hook and low kick meet B's elbow
 * and early check, and B's jab off the check's rebound meets A's parry; A
 * circles in with the pump jab and a jab that B's glove and
 * guard meet; B gives ground and A cuts across, B's jab and cross meet A's
 * parry and slip and A's cross and body kick meet B's guard and dropped arm;
 * A circles once more and steps in with jab, cross, body hook and the
 * Brazilian kick into B's guard, right elbow and the dropped left arm, and
 * the kick lands behind his left ear at 150.000.
 *
 * Concretization: the phase is timed so the Brazilian kick's contact is the
 * window's end; the camera's widening at 143 is composed by the film from the
 * round's opening anchor.
 *
 * @param cast The cast.
 * @returns The scene's composition, its finishing contact at fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s10 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s10-b01 Check and cross.
 * @evidence docs/body/screenplay/kickboxing.md#s10-b02 Body hook, checked low kick, B's counter off the check.
 * @evidence docs/body/screenplay/kickboxing.md#s10-b02a A's pump jab and jab.
 * @evidence docs/body/screenplay/kickboxing.md#s10-b03 The tell once more.
 * @evidence docs/body/screenplay/kickboxing.md#s10-b04 The Brazilian kick lands at 150.000.
 */
export function theBrazilianKick(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(
    15,
    [
      then(
        exchange(
          cast,
          "s10-b01",
          b.jab().cross().hook().lowKick(),
          a.parry().slip().roll().check(),
        ),
        exchange(cast, "s10-b01c", a.cross(), b.take()),
      ),
      RingPhase.reset([a, "circle"], [b, "circle"]),
      then(
        exchange(cast, "s10-b02", b.jab(), a.slip()),
        exchange(
          cast,
          "s10-b02c",
          a.bodyHook().lowKick(),
          b.elbowBlock().check(),
        ),
        exchange(cast, "s10-b02c2", b.jab(), a.parry()),
      ),
      RingPhase.reset([a, "circle"], [b, "circle"]),
      exchange(
        cast,
        "s10-b02a",
        a.feintJab().jab(),
        b.tell("feint-jab").cover(),
      ),
      RingPhase.reset([b, "give"], [a, "press"]),
      then(
        exchange(cast, "s10-b03", b.jab().cross(), a.parry().slip()),
        exchange(
          cast,
          "s10-b03c",
          a.cross().bodyKick(),
          b.cover().next(b.tell("body-kick")),
        ),
      ),
      RingPhase.reset([a, "circle"]),
      exchange(
        cast,
        "s10-b04",
        a.jab().cross().bodyHook().brazilianKick(),
        b.cover().cover().elbowBlock().next(b.tell("brazilian-kick")),
      ),
    ],
    "s10-b04/3",
  );
}
