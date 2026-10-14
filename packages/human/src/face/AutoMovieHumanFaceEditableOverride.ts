/**
 * Editable scalar/enum fields of a source profile. A nonempty geometric
 * population is an asset, not a per-person override: an edit may omit it or
 * use [] to remove an inherited variable-length population. A fixed XYZ or
 * other tuple cannot be emptied and is not an editable coordinate. The
 * legacy hair-layer scalar transaction and skin-colour appearance population
 * are explicit document-level exceptions with a runtime geometry boundary.
 *
 * @evidence contracts/common.md#principled-implementation Variable-length arrays permit only empty removal, fixed tuples become never, and object members recurse into optional scalar edits.
 * @evidence contracts/common.md#clear-and-simple-design The conditional type separates arrays, objects and scalar leaves before constructing the recursive editable shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Compile-time restrictions do not replace assertHumanFaceEditableDetail's runtime boundary or authorize nonempty source geometry populations.
 * @evidence contracts/common.md#meaningful-documentation The description states removal semantics, tuple refusal and the explicit document-level hair and skin-colour exceptions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Recursive editable profile type is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Recursive editable profile type specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Recursive editable profile type acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 */
export type AutoMovieHumanFaceEditableOverride<T> = T extends readonly unknown[]
  ? number extends T["length"]
    ? []
    : never
  : T extends object
    ? { [K in keyof T]?: AutoMovieHumanFaceEditableOverride<T[K]> }
    : T;
