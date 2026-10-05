/**
 * Whether a value is a safe integer index into a population of `count`.
 *
 * @evidence contracts/common.md#principled-implementation Every source-partition id is checked by the one rule.
 * @evidence contracts/common.md#clear-and-simple-design One predicate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-integer, negative and unsafe values are all rejected.
 * @evidence contracts/common.md#meaningful-documentation States the rule.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The predicate defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The predicate consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The predicate emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Indices carry no unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The predicate builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The predicate displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The predicate carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The predicate admits indices, not anatomy.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The predicate converts no input.
 */
export function isHumanPersonSourceIndex(value: number, count: number): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value < count;
}
