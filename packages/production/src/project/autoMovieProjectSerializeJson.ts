

/**
 * Render native JSON.stringify output with two-space indentation and one trailing LF. Native omission, coercion, toJSON effects and cyclic/bigint failures remain; a top-level value with undefined stringify output becomes the literal undefined spelling plus LF, so this renderer is no JSON-schema admission. The caller owns the returned text.
 *
 * @evidence contracts/common.md#principled-implementation Native JSON.stringify with two-space indentation and a trailing LF produces the established stored text.
 * @evidence contracts/common.md#clear-and-simple-design One renderer serves all staged slices, manifests and clocks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native omission/null coercion and cyclic/bigint throws remain; this is not canonical JSON or schema admission.
 * @evidence contracts/common.md#meaningful-documentation States exact layout and throw-prone staging role.
 * @evidence contracts/performance.md#efficient-algorithms Traverses serialized values/output C text, with native hooks able to add unbounded user work.
 * @evidence contracts/performance.md#reuse-equivalent-work One rendered string serves subsequent writes; no mutable-object serialization cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the text and no descriptor or task is acquired.
 */
export const autoMovieProjectSerializeJson: (value: unknown) => string = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
