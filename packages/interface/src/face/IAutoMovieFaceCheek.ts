/**
 * Traits of one cheek: signed morph weights in `[-2, 2]`, with `0` or omission
 * meaning unchanged.
 *
 * Lives under {@link IAutoMovieFaceCheekSet.left} or `right`; when it is the
 * only side stated, it applies to both cheeks. `fullness` projects onto the
 * `cheekFullnessR` and `cheekFullnessL` morph targets.
 *
 * @evidence contracts/common.md#principled-implementation `flattenFace` reads `fullness` for `cheekFullnessR` from `right` and for `cheekFullnessL` from `left`, using the other side when one is absent, and `morphFace` adds that weight times each target's delta.
 * @evidence contracts/common.md#clear-and-simple-design A single-leaf side record keeps the cheek extensible by field while the pair rule lives once on the set type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The cheek follows the same side rule as eyes and brows with no cheek-specific handling, and an out-of-range weight is reported by `validateFace` rather than clamped.
 * @evidence contracts/common.md#meaningful-documentation States the weight range and neutral meaning, the lone-side rule, and the two morph targets the leaf drives; the member gives each sign's direction.
 * @author Samchon
 */
export interface IAutoMovieFaceCheek {
  /** Volume of the cheek around the cheekbone: `+` full and round, `-` gaunt. */
  fullness?: number;
}
