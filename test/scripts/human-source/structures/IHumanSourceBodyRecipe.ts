/**
 * The upstream recipe of one published body endpoint, unrounded, in the
 * shared frame: a regional target or macro node is its own replayed delta, a
 * macro pair the pair state minus its two endpoint deltas (the extractor's
 * combination residual). `skin` has XYZ per source vertex, `landmarks` per
 * sampled joint cube.
 *
 * @author Samchon
 */
export interface IHumanSourceBodyRecipe {
  state: string;
  skin: Float64Array;
  landmarks: Float64Array;
}
