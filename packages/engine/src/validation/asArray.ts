/**
 * Borrow an actual array or return a fresh empty array after separate shape admission.
 *
 * @evidence contracts/common.md#principled-implementation Array.isArray distinguishes the runtime array representation; accepted arrays are returned by identity, and every other unknown value produces an empty array.
 * @evidence contracts/common.md#clear-and-simple-design Artifact validators can continue population traversal after separately reporting shape failures, sharing one conversion owner rather than casts scattered among callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The empty fallback is a traversal aid, not successful schema admission; sparse arrays and elements remain unchanged and are not validated here.
 * @evidence contracts/common.md#meaningful-documentation States borrowed identity, fresh fallback and the requirement that another gate report an invalid container.
 * @evidence contracts/performance.md#efficient-algorithms A single array test and at most one empty allocation take constant work independent of element count.
 * @evidence contracts/performance.md#reuse-equivalent-work One shared shape projection avoids duplicate coercion policies; mutable arrays are neither copied nor memoized.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned accepted array remains caller-owned; the fallback transfers fresh empty storage and no input object or handle is otherwise retained.
 * @author Samchon
 */
export const asArray: (value: unknown) => unknown[] = (
  value: unknown,
): unknown[] => (Array.isArray(value) ? value : []);
