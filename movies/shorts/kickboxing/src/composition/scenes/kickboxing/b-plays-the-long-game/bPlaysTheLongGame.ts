import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";
import { RingPhase } from "../../../../interactions/kickboxing/RingPhase";
import { exchange } from "../../../../interactions/kickboxing/exchange";

/**
 * Scene 3, 30–45 s: B's drag feint draws A's check and the real low kick
 * lands; B's four meet A's cover, cover, roll and check and A's cross meets
 * B's guard; A's double jab finds B's nose; B's jab feint raises A's glove
 * and the body hook lands under it; A's jab and low kick meet B's cover and
 * check and B's cross from the check meets A's slip.
 *
 * Concretization: B steps back out of range before his jab feint by giving
 * ground; the counters from the checks step in on their first strike.
 *
 * @param cast The cast.
 * @returns The scene's composition, filling its fifteen seconds.
 * @evidence docs/body/screenplay/kickboxing.md#s03 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s03-b01 The drag feint and the real low kick.
 * @evidence docs/body/screenplay/kickboxing.md#s03-b02 B's four and A's check.
 * @evidence docs/body/screenplay/kickboxing.md#s03-b03 The double jab.
 * @evidence docs/body/screenplay/kickboxing.md#s03-b04 The feint and the body hook.
 * @evidence docs/body/screenplay/kickboxing.md#s03-b05 Check and counter.
 */
export function bPlaysTheLongGame(cast: IRingCast): AutoMovieComposition {
  const { a, b } = cast;
  const then = AutoMovieComposition.sequence;
  return RingPhase.fill(15, [
    exchange(cast, "s03-b01", b.feintLowKick().lowKick(), a.tell("feint-low-kick").take()),
    RingPhase.reset([a, "circle"]),
    then(exchange(cast, "s03-b02", b.jab().cross().hook().lowKick(), a.cover().cover().roll().check()), exchange(cast, "s03-b02c", a.cross(), b.cover())),
    RingPhase.reset([b, "give"], [a, "press"]),
    exchange(cast, "s03-b03", a.jab().jab(), b.cover().take()),
    RingPhase.reset([b, "give"]),
    exchange(cast, "s03-b04", b.feintJab().bodyHook(), a.tell("feint-jab").take()),
    RingPhase.reset([a, "circle"]),
    then(exchange(cast, "s03-b05", a.jab().lowKick(), b.cover().check()), exchange(cast, "s03-b05c", b.cross(), a.slip())),
  ]);
}
