import { AutoMovieComposition } from "@automovie/engine";

import type { IRingCast } from "../../../../interactions/kickboxing/IRingCast";

/**
 * Scene 11, from the finish at 150.000 to "Ten!" at 167.000: B falls onto
 * his right side by 151.600 while A recoils and stops; the referee calls
 * "Down!", sends A to the farthest neutral corner and A walks there and
 * turns to the centre; at 157.000 the referee raises the counting hand and
 * counts one number per second from 158.000, B bracing, pushing, trembling
 * and lowering again; at eight the referee assesses B, at nine B moves a
 * little, at ten he is still down.
 *
 * Concretization: the referee's "Down!" begins with the fall and "Neutral
 * corner!" when B has landed; A walks to the corner in eight steps; B's
 * attempts are a brace and push from 158.000 to 162.500 and a small move at
 * 166.000, and he lies still between them; each signal holds one second.
 *
 * @param cast The cast.
 * @returns The scene, aligned to the finishing contact's anchor.
 * @evidence docs/body/screenplay/kickboxing.md#s11 The scene.
 * @evidence docs/body/screenplay/kickboxing.md#s11-b01 The fall onto the right side by 151.600 and "Down!".
 * @evidence docs/body/screenplay/kickboxing.md#s11-b02 "Neutral corner!" and A's walk to the corner before 157.000.
 * @evidence docs/body/screenplay/kickboxing.md#s11-b03 The count from 157.000, "One!" at 158.000 to "Seven!" at 164.000, and B's attempts.
 * @evidence docs/body/screenplay/kickboxing.md#s11-b04 "Eight!" to "Ten!" at 167.000.
 */
export function downAndTheCount(cast: IRingCast): AutoMovieComposition {
  const { a, b, referee } = cast;
  const at = (offset: number, part: { readonly node: AutoMovieComposition }): AutoMovieComposition =>
    AutoMovieComposition.at("s10-b04/3", part, offset);
  const words: string[] = ["One!", "Two!", "Three!", "Four!", "Five!", "Six!", "Seven!", "Eight!", "Nine!", "Ten!"];
  return AutoMovieComposition.parallel(
    at(0, b.phase("fall", 1.6)),
    at(0, referee.signal("down", 1, "Down!")),
    at(1.6, b.phase("lie", 6.4)),
    at(1.6, referee.signal("neutral-corner", 1.5, "Neutral corner!")),
    at(1.6, a.move("corner", 8)),
    at(7, referee.signal("count", 1)),
    ...words.map((word: string, k: number) => at(8 + k, referee.signal("count", 1, word, k === 9 ? "count-10" : undefined))),
    at(8, b.phase("attempt", 4.5)),
    at(12.5, b.phase("lie", 3.5)),
    at(16, b.phase("attempt", 0.8)),
    at(16.8, b.phase("lie", 13.2)),
  );
}
