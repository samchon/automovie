import { AutoMovieArchetypeUnits } from "../../core";

/*
 * The pool table read.
 */
export const WPA: string =
  "WPA Recommended Equipment Specifications: a 9 ft table's playing surface 100 (+1/8) x 50 (+1/8) in (5); the bed 29 1/4 to 31 in above the floor (2); the cushion's nose 62 1/2 to 64 1/2% of the ball's diameter above the bed (7); rails 4 to 7 1/2 in wide with the cushions (6); balls 2 1/4 in across (16) (https://wpapool.com/wp-content/uploads/2024/01/RECOMMENDED-EQUIPMENT-SPECIFICATIONS.pdf)";

/*
 * The ball's diameter, metres: WPA 16, 2 1/4 in.
 */
export const BALL: number = 2.25 * AutoMovieArchetypeUnits.INCH;

/*
 * Mouth widths at the lower end of WPA §9, metres.
 */
export const MOUTH = {
  corner: 4.5 * AutoMovieArchetypeUnits.INCH,
  side: 5 * AutoMovieArchetypeUnits.INCH,
} as const;
