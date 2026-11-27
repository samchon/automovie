/**
 * The vertical component above which an envelope face stops being a facade.
 *
 * `Math.SQRT1_2` is the sine of forty-five degrees, so a face tilted past that
 * is more horizontal than vertical.
 */
export const AutoMovieEngineEnvelopeFacadeLimit: number = Math.SQRT1_2;
