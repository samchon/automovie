/**
 * Stable generated free-shaft identity of one side and lid row.
 * Emission and final-output readers share this owner; the person assembly
 * supplies its face prefix independently from source-card names.
 *
 * @evidence contracts/common.md#principled-implementation The same side and row identify the generated shaft part in emission and asset measurement.
 * @evidence contracts/common.md#clear-and-simple-design One generated name owner without source-asset heuristics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names generated parts only and never guesses a source card role.
 * @evidence contracts/common.md#meaningful-documentation States semantic identity and prefix ownership.
 * @evidence contracts/modeling.md#part-identity-and-grouping Names one independent shaft population group.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Identity has no unit or coordinate.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Names supply no clinical follicle count.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
 */
export function humanFaceLashPartId(side: "left" | "right", row: "upper" | "lower"): string {
  return "lashes:" + side + ":" + row;
}
