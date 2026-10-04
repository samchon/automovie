/**
 * Exact structural equality of two preview values: primitives by identity
 * (`NaN` equals `NaN`), arrays and typed arrays element by element, plain
 * objects key by key with an `undefined` member treated as absent. It answers
 * the question a serialized comparison used to answer without building a
 * string of the whole value, so comparing two large models allocates nothing.
 *
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Decides resident buffer reuse from the actual static model structure.
 */
export function sameHumanPreviewValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null)
    return false;
  if (ArrayBuffer.isView(a) || Array.isArray(a)) {
    if (!(ArrayBuffer.isView(b) || Array.isArray(b))) return false;
    const left = a as ArrayLike<unknown>;
    const right = b as ArrayLike<unknown>;
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; ++index)
      if (!sameHumanPreviewValue(left[index], right[index])) return false;
    return true;
  }
  if (ArrayBuffer.isView(b) || Array.isArray(b)) return false;
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys)
    if (!sameHumanPreviewValue(left[key], right[key])) return false;
  return true;
}
