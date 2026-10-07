import type { AutoMovieHumanPersonHeadShapeField } from "../structures/AutoMovieHumanPersonHeadShapeField";

/**
 * The public source-neutral difference unit of a closed head trait.
 *
 * Forehead and either pinna inclination are angular differences in degrees;
 * every other registered exterior trait is a millimetre difference. The
 * publisher and resolver share this owner so a source descriptor cannot
 * silently reinterpret the person's number. Authored endpoint magnitude and
 * support remain source-owned, independent of this unit classification.
 *
 * @evidence contracts/common.md#principled-implementation The same closed public trait has one unit for source registration and document resolution.
 * @evidence contracts/common.md#clear-and-simple-design Three angular identities; all remaining closed traits are lengths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source metadata cannot replace the public input unit.
 * @evidence contracts/common.md#meaningful-documentation States angular identities and source-magnitude ownership.
 * @evidence contracts/modeling.md#spatial-conventions Degrees for inclination differences, millimetres for other source-neutral differences.
 * @evidence contracts/anatomy.md#parametric-authority Only the closed head trait set selects a source unit.
 */
export function humanPersonHeadShapeFieldUnit(field: AutoMovieHumanPersonHeadShapeField): "mm" | "degree" {
  return field === "cranial.foreheadInclination" || field === "ears.left.pinnaInclination" || field === "ears.right.pinnaInclination" ? "degree" : "mm";
}
