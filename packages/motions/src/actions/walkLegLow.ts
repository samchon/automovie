/**
 * The share of a bracket round a room's low that the search narrows it to: what
 * the twenty-four ternary steps it replaces left, so the low is placed as
 * finely as they placed it.
 */
const NARROWED: number = (2 / 3) ** 24;

/**
 * The golden section's share of a bracket, `(sqrt(5) - 1) / 2`: an inner point
 * at it stays an inner point of the narrowed bracket.
 */
const GOLDEN: number = (Math.sqrt(5) - 1) / 2;

/**
 * Narrow a bracket round the low of a planted foot's room (`walkLegRise`) by
 * golden-section search (Kiefer 1953, "Sequential minimax search for a
 * maximum").
 *
 * The rule is the ternary search's it replaces: of two inner pitches, the one
 * with the lower room keeps its side of the bracket, and equal rooms keep the
 * nearer side. A golden-section step keeps one inner pitch of the step before
 * and reads one new room, so the bracket shrinks by 0.618 a read where a
 * ternary step shrank it by two thirds in two reads: 23 reads for the width 48
 * gave.
 *
 * @param room The room a pitch leaves, degrees; `-Infinity` where the leg
 *   cannot stand.
 * @param far The bracket's steeper end, degrees.
 * @param near The bracket's end nearer the asked pitch, degrees, not below
 *   `far`.
 * @returns The narrowed bracket, steeper end first, `NARROWED` of the given one
 *   wide or less.
 */
export function walkLegLow(
  room: (degrees: number) => number,
  far: number,
  near: number,
): [number, number] {
  const narrow: number = (near - far) * NARROWED;
  if (!(near - far > narrow)) return [far, near];
  let a: number = near - GOLDEN * (near - far);
  let b: number = far + GOLDEN * (near - far);
  let atA: number = room(a);
  let atB: number = room(b);
  while (near - far > narrow) {
    if (atA < atB) {
      near = b;
      b = a;
      atB = atA;
      a = near - GOLDEN * (near - far);
      atA = room(a);
    } else {
      far = a;
      a = b;
      atA = atB;
      b = far + GOLDEN * (near - far);
      atB = room(b);
    }
  }
  return [far, near];
}
