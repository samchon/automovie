/**
 * Refuse a face document that holds a non-finite number or a cyclic reference,
 * walking every nested object.
 *
 * Shared by `parseHumanFaceDocument` (load) and `serializeHumanFaceDocument`
 * (save), so a document that cannot be saved cannot be loaded either.
 * `ancestors` is the path of objects being walked, so an object reached twice
 * without being its own ancestor (a shared but acyclic reference) is accepted.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Depth-first traversal rejects nonfinite numbers and path-ancestor cycles while allowing shared acyclic objects. Parser/save consumers supply plain schema data; Object.values enumerates own enumerable values rather than prototype fields or arbitrary object internals.
 * @evidence contracts/common.md#clear-and-simple-design One shared numeric/cycle boundary serves load and save; schema, immutable-detail and geometry admission retain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nonfinite number is converted to a saved null and no repeated acyclic reference is falsely treated as a cycle. This is not schema/array-density or arbitrary-class validation; a thrown traversal may leave a caller-supplied ancestor set populated.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes current ancestor path from global visited population and explains load/save symmetry and refusal; the normal default set is invocation-owned.
 * @evidence contracts/performance.md#efficient-algorithms Traversal follows each expanded own-value occurrence, including repeated shared subtrees; recursion depth follows nesting and no explicit depth/work cap exists. Deep valid input can exhaust the call stack.
 * @evidence contracts/performance.md#reuse-equivalent-work One rule serves serialization/parsing; path membership cannot globally memoize shared subtrees without changing cycle semantics. Successful recursion removes each path object on return.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The default set retains at most current path depth until completion/failure collection; no external handle exists. A supplied set remains caller-owned and can retain failure ancestors because cleanup is not in finally.
 */
export function assertFinite(
  value: unknown,
  ancestors: Set<object> = new Set<object>(),
): void {
  if (typeof value === "number" && !Number.isFinite(value))
    throw new Error("Face document numbers must be finite.");
  if (value !== null && typeof value === "object") {
    if (ancestors.has(value))
      throw new Error("Face documents cannot contain cyclic references.");
    ancestors.add(value);
    for (const item of Object.values(value)) assertFinite(item, ancestors);
    ancestors.delete(value);
  }
}
