

/**
 * Require exactly the declared own scalar keys with finite values strictly above zero.
 *
 * @evidence contracts/common.md#principled-implementation Own-key count and hasOwnProperty checks combine with Number.isFinite and strict positivity; inherited or extra keys cannot substitute for required parameters.
 * @evidence contracts/common.md#clear-and-simple-design Collision and measurement families supply their fixed supported key lists to one scalar rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This checks scalar spelling/value shape, not geometry enclosure, units conversion or correspondence to an imported appearance.
 * @evidence contracts/common.md#meaningful-documentation Documents exact own-key membership, finite-positive acceptance and unchanged input values.
 * @evidence contracts/performance.md#efficient-algorithms Object.keys visits K actual keys and every checks R required keys with expected constant ownership lookups; temporary key storage is O(K).
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every supplied parameter object is independently checked; no mutable-object validity cache is retained.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No input or resource survives the boolean result; temporary own-key strings retire with the call.
 *
 * @author Samchon
 */
export function positiveFiniteValues(
  values: Record<string, number>,
  keys: readonly string[],
): boolean { return Object.keys(values).length === keys.length &&
  keys.every(
    (key: string) : boolean =>
      Object.prototype.hasOwnProperty.call(values, key) &&
      Number.isFinite(values[key]) &&
      values[key]! > 0,
  ); }
