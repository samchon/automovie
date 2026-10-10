/**
 * Compare exact plain source values without serializing large geometry arrays.
 * Object key order carries no source meaning; array order and every scalar do.
 * Actual body source records are plain JSON values admitted by their schema.
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
