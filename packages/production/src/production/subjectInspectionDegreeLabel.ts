

/**
 * Round an angle to a signed whole-degree viewpoint label.
 *
 * @evidence contracts/common.md#principled-implementation Standard rounding and a three-digit minimum-width magnitude form labels, with n marking negative values.
 * @evidence contracts/common.md#clear-and-simple-design The planner independently refuses duplicate labels after rounding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Labels are identities rather than angular measurements; close rings can collide and the width does not truncate larger magnitudes.
 * @evidence contracts/common.md#meaningful-documentation The convention preserves nonnegative and negative labels without a sampling tolerance.
 * @evidence contracts/performance.md#efficient-algorithms Rounding/string conversion/padding cost follows the short numeric text.
 * @evidence contracts/performance.md#reuse-equivalent-work The same label owner serves both azimuth and elevation naming.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the label string escapes and no angle registry is retained.
 */
export function subjectInspectionDegreeLabel(
  degrees: number
): string {
  const rounded: number = Math.round(degrees);
  const magnitude: string = Math.abs(rounded).toString().padStart(3, "0");
  return rounded < 0 ? `n${magnitude}` : magnitude;
}
