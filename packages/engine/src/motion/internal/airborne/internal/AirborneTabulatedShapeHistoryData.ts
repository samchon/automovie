/*
 * Scalars tabulated a knot: six of the symmetric tensor, three of the relative
 * momentum.
 */
export const WIDTH: number = 9;

/*
 * Maximum knot count within the portable 32-bit packed array length.
 */
export const MAX_KNOTS: number = Math.floor(0xffff_ffff / WIDTH);
