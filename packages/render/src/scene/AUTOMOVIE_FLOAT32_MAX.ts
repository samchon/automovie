/**
 * The largest finite float32, `(2 - 2^-23) * 2^127`: the magnitude beyond which
 * rounding a double to the single precision a GPU buffer, a vertex attribute or
 * a depth plane stores overflows to an infinity.
 */
export const AUTOMOVIE_FLOAT32_MAX: number = (2 - 2 ** -23) * 2 ** 127;