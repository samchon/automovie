/**
 * Exact structural equality of two preview values: primitives by identity
 * (`NaN` equals `NaN`), arrays and typed arrays element by element, plain
 * objects key by key with an `undefined` member treated as absent. It answers
 * the question a serialized comparison used to answer without building a
 * string of the whole value. Object comparison still allocates its key lists
 * and their union set; avoiding serialization is not an allocation-free path.
 *
 * @evidence contracts/common.md#principled-implementation Object.is preserves primitive identity including NaN, sequences compare lengths/elements recursively, and enumerable object keys compare with undefined treated as absent. Current callers supply acyclic numerical arrays/plain records; arbitrary class instances, DataView, symbols, nonenumerable fields and prototypes are not admitted equivalence dimensions by this implementation.
 * @evidence contracts/common.md#clear-and-simple-design One recursive value comparator replaces whole-model text serialization for static reuse structures and witness arrays without introducing a hash or detached equivalence cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equality reads actual numerical/configuration values instead of source/prose fingerprints or fixture identity. Sequence constructor identity is ignored, and cyclic or very deep objects have no cycle/depth guard; supported model records avoid those shapes.
 * @evidence contracts/common.md#meaningful-documentation The comment gives NaN, element-wise and undefined-as-absent semantics and acknowledges key/set allocation. It does not certify equal native renders or arbitrary JavaScript objects.
 * @evidence contracts/performance.md#efficient-algorithms Visits compared elements/keys until the first difference; object branches allocate two key arrays and a union set, and recursion storage scales with nesting depth. No entire numerical array is converted to text.
 * @evidence contracts/performance.md#reuse-equivalent-work Callers use this exact value comparison to decide static buffer reuse; the comparator itself retains no previous input or cached verdict and rereads mutable candidates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows both values and retains only temporary recursion/key structures until the call returns. It stores no witness, model or native handle for later requests.
 */
export function sameHumanPreviewValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  )
    return false;
  if (ArrayBuffer.isView(a) || Array.isArray(a)) {
    if (!(ArrayBuffer.isView(b) || Array.isArray(b))) return false;
    const left: ArrayLike<unknown> = a as ArrayLike<unknown>;
    const right: ArrayLike<unknown> = b as ArrayLike<unknown>;
    if (left.length !== right.length) return false;
    for (let index: number = 0; index < left.length; ++index)
      if (!sameHumanPreviewValue(left[index], right[index])) return false;
    return true;
  }
  if (ArrayBuffer.isView(b) || Array.isArray(b)) return false;
  const left: Record<string, unknown> = a as Record<string, unknown>;
  const right: Record<string, unknown> = b as Record<string, unknown>;
  const keys: Set<string> = new Set([
    ...Object.keys(left),
    ...Object.keys(right),
  ]);
  for (const key of keys)
    if (!sameHumanPreviewValue(left[key], right[key])) return false;
  return true;
}
