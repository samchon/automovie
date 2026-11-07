import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";

/**
 * Scene 12, from "Ten!" to 180: at 167.600 the referee sweeps both hands
 * across to end the contest and indicates A, announcing "Knockout! Red
 * wins!"; A throws both gloves overhead at 168.100 and celebrates with quick
 * steps along his own side; from 169.000 the referee crouches beside B; the
 * match-ending bell rings at 170.100; B stays down, breathing, to the end.
 *
 * Concretization: A's victory steps take him toward his own red corner, two
 * steps per second for eight steps, then he keeps celebrating in place; the
 * winner gesture follows the sweep.
 *
 * @param cast The cast.
 * @returns The scene, aligned to the "Ten!" anchor at 167.000.
 * @evidence docs/body/screenplay/kickboxing.md#s12 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s12-b01 The knockout signal at 167.600 and the announcement.
 * @evidence docs/body/screenplay/kickboxing.md#s12-b02 The celebration from 168.100.
 * @evidence docs/body/screenplay/kickboxing.md#s12-b03 The crouch from 169.000 and the bell at 170.100 to the end at 180.
 */
export function knockoutAndCelebration(cast: IRingCast): AutoMovieComposition {
  const { a, referee, bell } = cast;
  const at = (offset: number, part: { readonly node: AutoMovieComposition }): AutoMovieComposition =>
    AutoMovieComposition.at("count-10", part, offset);
  return AutoMovieComposition.parallel(
    at(0.6, referee.signal("knockout", 1.2, "Knockout! Red wins!")),
    at(1.8, referee.signal("winner", 0.2)),
    at(1.1, a.phase("victory", 11.9)),
    at(1.1, a.move("celebrate", 8)),
    at(2, referee.signal("attend", 11)),
    at(3.1, bell.ring()),
  );
}
