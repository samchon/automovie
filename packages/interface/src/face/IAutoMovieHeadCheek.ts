import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Cheek and cheekbone traits of an {@link IAutoMovieHead}: signed weights in
 * `[-2, 2]`, omitted meaning unchanged, applied to both sides at once.
 * `flattenHead` projects `fullness` onto `cheekFull` and `bones` onto
 * `cheekBones`.
 *
 * @evidence contracts/common.md#principled-implementation `flattenHead` maps `fullness` to `cheekFull` and `bones` to `cheekBones`, keeping soft-tissue volume and malar prominence as two independent additive deltas.
 * @evidence contracts/common.md#clear-and-simple-design Two leaves for the two tissues a cheek edit usually names, with no left and right split, unlike the face vocabulary's cheek pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Symmetric only: there is no per-side cheek control in this vocabulary, and the projection copies each cheek value without scaling or clamping.
 * @evidence contracts/common.md#meaningful-documentation Adds the owning document, the range, neutral omission, the symmetric application and both morph names; members give the direction of fullness and prominence.
 * @author Samchon
 */
export interface IAutoMovieHeadCheek {
  /** Soft cheek fullness: `+` fuller (youthful), `-` gaunt. */
  fullness?: AutoMovieFaceWeight;

  /** Malar/cheekbone prominence: `+` higher/sharper (mature beauty). */
  bones?: AutoMovieFaceWeight;
}
