/**
 * The vertical component above which an envelope face stops being a facade.
 *
 * `Math.SQRT1_2` is the sine of forty-five degrees, so a face tilted past that
 * is more horizontal than vertical.
 */
export const AUTOMOVIE_ENVELOPE_FACADE_LIMIT: number = Math.SQRT1_2;
