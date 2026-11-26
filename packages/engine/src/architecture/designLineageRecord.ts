/**
 * Serialize fields into one digest line no authored text can forge.
 *
 * Each field is written as its UTF-16 length, a colon and the field itself, and
 * fields are joined by `|`. Because every field carries its own length, a `|`
 * or `:` inside authored text cannot be read as a boundary, so two different
 * field lists never produce the same line. Lines are later joined by `\n`,
 * which the length prefix also protects.
 *
 * @param fields The fields of one record, in their canonical order.
 * @returns The length-prefixed line.
 */
export function designLineageRecord(...fields: readonly string[]): string {
  return fields
    .map((field: string): string => `${field.length}:${field}`)
    .join("|");
}
