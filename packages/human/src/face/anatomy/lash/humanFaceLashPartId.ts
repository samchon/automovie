/**
 * Stable generated free-shaft identity of one side and lid row.
 * Emission and final-output readers share this owner; the person assembly
 * supplies its face prefix independently from source-card names.
 */
export function humanFaceLashPartId(
  side: "left" | "right",
  row: "upper" | "lower",
): string {
  return "lashes:" + side + ":" + row;
}
