import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";

/**
 * Scene 12, from "Ten!" to 180: at 167.600 the referee waves the contest
 * off with "That's it!" and goes straight to B, crouching over him and
 * lifting a hand for the doctor; A throws his gloves overhead at 168.100
 * and walks his victory lap along his own side with them up; the bell rings
 * out at 170.100; the unseen doctor reaches B at about 172; at 172.100 A
 * walks over and stands relaxed a stride from B, gloves at his waist,
 * checking on him; from 174.000 the referee walks to A and raises his arm,
 * and A's free glove goes up with it for a second before he lowers it and
 * looks down at B, standing relaxed to the end at 180.
 *
 * Concretization: A's gloves stay in the victory pose through the five
 * walking steps of his lap, to about 171.8; he walks to a stride from B in
 * three walking steps by about 173.7; none of his phases and movements
 * overlap. The referee's raise begins when his walk brings him beside A,
 * about 0.6 s into the winner signal, which holds five seconds for the walk
 * and the raise; A's free glove goes up at that arrival.
 *
 * @param cast The cast.
 * @returns The scene, aligned to the "Ten!" anchor at 167.000.
 * @evidence docs/body/screenplay/kickboxing.md#s12 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s12-b01 The wave-off at 167.600 and "That's it!".
 * @evidence docs/body/screenplay/kickboxing.md#s12-b02 The referee attends B and calls the doctor; A celebrates from 168.100; the bell at 170.100.
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
    at(1.1, a.phase("victory", 1)),
    at(2.1, a.move("celebrate", 5)),
    at(3.1, bell.ring()),
    at(5.1, a.move("walk", 3, CHECK_RANGE)),
    at(7, a.phase("relax", RAISE_ARRIVAL)),
    at(7, referee.signal("winner", 5)),
    at(7 + RAISE_ARRIVAL, a.phase("victory", 1)),
    at(8 + RAISE_ARRIVAL, a.phase("relax", 5 - RAISE_ARRIVAL)),
  );
}

/** How near A comes to check on B, metres between their stance origins (film choice: a stride from the fallen man). */
const CHECK_RANGE: number = 1.5;

/** Seconds from the winner signal to the referee's arrival beside A, when the raise starts: his walk of about 1.5 m from B at 2.53 m/s. */
const RAISE_ARRIVAL: number = 0.6;
