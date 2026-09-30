/**
 * Serialize only numerical preview protocol fields, preserving transferred
 * Float32/Uint32 geometry with explicit tags. Display/reference metadata is
 * outside this projection and cannot enter disk persistence through an extra
 * caller field. Export bytes are a different operation and refuse here.
 *
 * @evidence contracts/common.md#principled-implementation An explicit numerical-field projection excludes unrelated display metadata and tags the two transferred geometry array kinds.
 * @evidence contracts/common.md#clear-and-simple-design One codec owns disk representation, independent of viewport and reference-resource IO.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Serializes the real preview result without subject-specific substitutions.
 * @evidence contracts/common.md#meaningful-documentation Explains privacy, typed-array preservation and export refusal.
 */
export function encodeHumanViewerPreview(value: {
  operation: string;
  model?: unknown;
  articulation?: unknown;
  contact?: unknown;
  crossings?: unknown;
  extras?: unknown;
  anatomy?: unknown;
}): string {
  if (value.operation !== "preview" || value.model === undefined)
    throw new Error("Only numerical previews are cached");
  return JSON.stringify(
    {
      operation: "preview",
      model: value.model,
      articulation: value.articulation,
      contact: value.contact,
      crossings: value.crossings,
      extras: value.extras,
      anatomy: value.anatomy,
    },
    (_key, entry) =>
      entry instanceof Float32Array
        ? { $array: "Float32", values: Array.from(entry) }
        : entry instanceof Uint32Array
          ? { $array: "Uint32", values: Array.from(entry) }
          : entry,
  );
}
