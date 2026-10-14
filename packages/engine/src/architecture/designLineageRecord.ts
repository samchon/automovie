/**
 * Serialize fields into one digest line no authored text can forge.
 *
 * Each field is written as its UTF-16 length, a colon and the field itself,
 * and fields are joined by `|`. Because every field carries its own length, a
 * `|` or `:` inside authored text cannot be read as a boundary, so two
 * different field lists never produce the same line. Lines are later joined
 * by `\n`, which the length prefix also protects.
 *
 * @param fields The fields of one record, in their canonical order.
 * @returns The length-prefixed line.
 *
 * @evidence contracts/common.md#principled-implementation Length-prefixed encoding is injective: a reader that knows each field's length can split the line uniquely, so distinct field lists always give distinct lines and the digest over them cannot collide by concatenation.
 * @evidence contracts/common.md#clear-and-simple-design One encoder shared by the lineage digest, the view digest and the variant comparison key, which each kept a private copy that had to stay identical.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Escapes nothing and special-cases no character; the length prefix makes every character safe.
 * @evidence contracts/common.md#meaningful-documentation States the exact format, the unit of the length, and why authored separators cannot forge a boundary.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the total field length, one map and one join.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure encoder of its arguments that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned string.
 */
export const designLineageRecord: (...fields: readonly string[]) => string = (
  ...fields: readonly string[]
): string =>
  fields.map((field: string): string => `${field.length}:${field}`).join("|");
