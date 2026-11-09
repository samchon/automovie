import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";

/**
 * Scene 12, from "Ten!" to 180: at 167.600 the referee waves the contest
 * off with "That's it!" and goes straight to B, crouching over him; A
 * celebrates on his own side from 168.100; the bell rings out at 170.100;
 * at 172.100 A walks over to B and stands over him, checking on him; from
 * 174.000 the referee goes to A and raises his arm, A celebrating again
 * beside the fallen man, to the end at 180.
 *
 * Concretization: A's victory steps take him along his own side for six
 * steps, then he walks to within a metre of B in four; the referee's crouch
 * over B holds until he leaves for A's raise, which holds four seconds.
 *
 * @param cast The cast.
 * @returns The scene, aligned to the "Ten!" anchor at 167.000.
 * @evidence docs/body/screenplay/kickboxing.md#s12 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s12-b01 The wave-off at 167.600 and "That's it!".
 * @evidence docs/body/screenplay/kickboxing.md#s12-b02 The referee attends B; A celebrates from 168.100; the bell at 170.100.
 * @evidence docs/body/screenplay/kickboxing.md#s12-b03 A checks on B from 172.100.
 * @evidence docs/body/screenplay/kickboxing.md#s12-b04 The referee raises A's arm from 174.000 to the end at 180.
 */
export function knockoutAndCelebration(cast: IRingCast): AutoMovieComposition {
  const { a, referee, bell } = cast;
  const at = (
    offset: number,
    part: { readonly node: AutoMovieComposition },
  ): AutoMovieComposition => AutoMovieComposition.at("count-10", part, offset);
  return AutoMovieComposition.parallel(
    at(0.6, referee.signal("knockout", 1.2, "That's it!")),
    at(1.1, referee.signal("attend", 5.9)),
    at(1.1, a.phase("victory", 4)),
    at(1.1, a.move("celebrate", 6)),
    at(3.1, bell.ring()),
    at(5.1, a.move("approach", 4, CHECK_RANGE)),
    at(7.1, a.phase("guard", 1.9)),
    at(7, referee.signal("winner", 4)),
    at(9, a.phase("victory", 4)),
  );
}

/** How near A comes to check on B, metres between their stance origins (film choice: within arm's reach of the fallen man). */
const CHECK_RANGE: number = 1;
