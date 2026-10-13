/**
 * Cheek and cheekbone traits of an {@link IAutoMovieHead}: signed weights in
 * `[-2, 2]`, omitted meaning unchanged, applied to both sides at once.
 * `flattenHead` projects `fullness` onto `cheekFull` and `bones` onto
 * `cheekBones`.
 *
 * @author Samchon
 */
export interface IAutoMovieHeadCheek {
  /** Soft cheek fullness: `+` fuller (youthful), `-` gaunt. */
  fullness?: number;

  /** Malar/cheekbone prominence: `+` higher/sharper (mature beauty). */
  bones?: number;
}
