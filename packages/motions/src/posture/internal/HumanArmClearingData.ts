/*
 * The most a clearing turns either freedom from the given arm, degrees
 * (provisional: beyond it the arm is no longer the carry's).
 */
export const SPAN: number = 40;

/*
 * The step a direction is scanned in for its first clear turn, degrees
 * (provisional: a few centimetres at the hand).
 */
export const STEP: number = 5;

/*
 * The room over its allowance a clearing leaves, degrees (provisional: a
 * twentieth of a degree, a quarter of a millimetre at the elbow).
 */
export const TOLERANCE: number = 0.05;

/*
 * The bisections that find the least clear turn inside one step: eight halve it
 * to 1/256 of the step, a fiftieth of a degree (provisional).
 */
export const HALVINGS: number = 8;

/*
 * The directions a clearing tries, in order, as shares of abduction and of
 * elbow flexion: out, folded, out and folded, then unfolded, out and unfolded,
 * in, in and folded, in and unfolded; and after those eight the eight that lie
 * midway between two of them, in the same order of their angles from out
 * through folded.
 */
export const ORDER: readonly (readonly [number, number])[] = [
  [1, 0],
  [0, 1],
  [Math.SQRT1_2, Math.SQRT1_2],
  [0, -1],
  [Math.SQRT1_2, -Math.SQRT1_2],
  [-1, 0],
  [-Math.SQRT1_2, Math.SQRT1_2],
  [-Math.SQRT1_2, -Math.SQRT1_2],
  ...[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(
    (degrees: number): readonly [number, number] => [
      Math.cos((degrees * Math.PI) / 180),
      Math.sin((degrees * Math.PI) / 180),
    ],
  ),
];
