import { AUTOMOVIE_HUMAN_HAND_SHAPE } from "./AUTOMOVIE_HUMAN_HAND_SHAPE";

/**
 * Locate each free proximal shaft beyond the farther of its adjacent webs.
 * The palm's depth fields and the digit sweep consume the same distal boundary.
 *
 * @param crotch Index-middle, middle-ring and ring-little web levels, local millimetres
 * @param length Hand length, millimetres
 * @returns Index, middle, ring and little shaft-root levels
 */
export function measureAutoMovieHumanFingerRoots(
  crotch: number[],
  length: number,
): number[] {
  return [0, 1, 2, 3].map(
    (i: number): number =>
      Math.max(
        ...[i - 1, i]
          .filter((w: number): boolean => w >= 0 && w < 3)
          .map((w: number): number => crotch[w]!),
      ) +
      AUTOMOVIE_HUMAN_HAND_SHAPE.layout.root * length,
  );
}
