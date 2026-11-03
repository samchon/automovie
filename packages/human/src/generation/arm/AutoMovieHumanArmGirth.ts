import { AutoMovieHumanMonotoneCubic } from "../../lofting/AutoMovieHumanMonotoneCubic";
import type { IAutoMovieHumanArmPiece } from "./IAutoMovieHumanArmPiece";

/**
 * The girth the arm asks for along its walk: the spans' knots laid end to end,
 * read by a monotone cubic (Fritsch and Carlson).
 *
 * Each span names the girth at its own sites (the biceps tape midway between
 * acromion and olecranon, the elbow tape over the olecranon, the forearm tape at
 * the belly, the wrist tape at stylion) and the observed shares of the tapes
 * between them, so each span rises or falls once. The monotone cubic keeps every
 * piece between its knot values whatever the tapes are, so no combination of
 * tapes makes a span overshoot, and it is C1 where two spans meet. A knot a
 * span copies from its neighbour is the neighbour's, and is kept once.
 */
export namespace AutoMovieHumanArmGirth {
  /**
   * The spans' knots in walk order, a shared boundary knot once.
   *
   * @param pieces The spans, proximal to distal.
   */
  export function knots(pieces: readonly IAutoMovieHumanArmPiece[]): [number, number][] {
    const out: [number, number][] = [];

    for (const piece of pieces)
      for (const knot of piece.knots) {
        const last: [number, number] | undefined = out[out.length - 1];

        // The distal span's first knot is the proximal span's last.
        if (last === undefined || knot[0] - last[0] > MERGE) out.push([knot[0], knot[1]]);
      }

    return out;
  }

  /**
   * The girth at a walk length, held past the first and last knots.
   *
   * @param list The knots from {@link knots}.
   * @param s Walk length, mm.
   */
  export function at(list: readonly [number, number][], s: number): number {
    return AutoMovieHumanMonotoneCubic.interpolate(list, s);
  }
}

/** Walk lengths closer than this are one knot, mm: a copied boundary knot is exact to rounding. */
const MERGE: number = 1e-6;
