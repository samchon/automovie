import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";

/**
 * Scene 12, from "Ten!" to 180: at 167.600 the referee waves the contest
 * off with "That's it!" and goes straight to B, crouching over him and
 * calling the doctor; A celebrates on his own side from 168.100; the bell
 * rings out at 170.100; the unseen doctor reaches B at about 172; at
 * 172.100 A walks over and stands a stride from B, checking on him; from
 * 174.000 the referee raises A's arm a step from the fallen man, A's free
 * glove up briefly before he looks down at B, to the end at 180.
 *
 * Concretization: A's victory walk along his own side is seven walking
 * steps to 172.000, then he steps to a stride from B in five fighting steps
 * by 174.000; no two of his movements overlap. The referee's crouch over B
 * holds until he leaves for A's raise, which holds four seconds; A's free
 * glove goes up for one second as his arm is raised, then he stands in
 * guard, looking down at B, to the end. The doctor is unseen.
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
    at(1.1, a.move("celebrate", 7)),
    at(3.1, bell.ring()),
    at(5.1, a.move("approach", 5, CHECK_RANGE)),
    at(7, a.phase("guard", 0.1)),
    at(7, referee.signal("winner", 4)),
    at(7.1, a.phase("victory", 1)),
    at(8.1, a.phase("guard", 4.9)),
  );
}

/** How near A comes to check on B, metres between their stance origins (film choice: a stride from the fallen man). */
const CHECK_RANGE: number = 1.5;
