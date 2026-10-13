/**
 * Cheek and cheekbone traits of an {@link IAutoMovieHead}: signed weights in
 * `[-2, 2]`, with omission leaving the template unchanged.
 *
 * Each weight applies to both sides at once. `flattenHead` renames `fullness`
 * to `cheekFull` and `bones` to `cheekBones`.
 *
 * @evidence contracts/common.md#principled-implementation `HEAD_PARAMETERS.cheek` in `flattenHead` renames the soft-tissue leaf and the skeletal leaf to two separate unsided names, so fat volume and malar prominence stay independent template targets.
 * @evidence contracts/common.md#clear-and-simple-design Two leaves separate the soft cheek from the cheekbone because they are different anatomical layers, and both stay unsided like every head group.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither leaf is derived from the other or from face width; each is copied as written for the template to interpret.
 * @evidence contracts/common.md#meaningful-documentation States the range and neutral meaning, that both sides move together, and the two morph names; members give each sign's direction.
 * @author Samchon
 */
export interface IAutoMovieHeadCheek {
  /** Soft cheek fullness: `+` fuller, `-` gaunt. */
  fullness?: number;

  /** Cheekbone prominence: `+` higher and sharper, `-` flatter. */
  bones?: number;
}
