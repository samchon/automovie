/**
 * Compare exact plain source values without serializing large geometry arrays.
 * Object key order carries no source meaning; array order and every scalar do.
 * Actual body source records are plain JSON values admitted by their schema.
 *
 * @evidence contracts/common.md#principled-implementation Compares each source leaf and resident array index exactly without coordinate tolerances or a header-only identity check.
 * @evidence contracts/common.md#clear-and-simple-design Identity fast path and recursive plain-value comparison avoid whole-geometry strings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every object key and ordered array element participates in equality.
 * @evidence contracts/common.md#meaningful-documentation States the plain JSON value domain and unordered object-key semantics.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no channel or gain.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The caller establishes source partition identity.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Converts no coordinate.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Reads values without emitting geometry.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#rendered-observation Observes no rendered model.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits no physiological bound.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Converts no personal input.
 */
export function equalHumanBodySourceValue(
  left: unknown,
  right: unknown,
): boolean {
  if (Object.is(left, right)) return true;
  if (
    left === null ||
    right === null ||
    typeof left !== "object" ||
    typeof right !== "object"
  )
    return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (
      !Array.isArray(left) ||
      !Array.isArray(right) ||
      left.length !== right.length
    )
      return false;
    for (let index = 0; index < left.length; index++)
      if (
        index in left !== index in right ||
        !equalHumanBodySourceValue(left[index], right[index])
      )
        return false;
    return true;
  }
  const leftKeys = Object.keys(left);
  if (leftKeys.length !== Object.keys(right).length) return false;
  for (const key of leftKeys)
    if (
      !Object.hasOwn(right, key) ||
      !equalHumanBodySourceValue(
        Reflect.get(left, key),
        Reflect.get(right, key),
      )
    )
      return false;
  return true;
}
