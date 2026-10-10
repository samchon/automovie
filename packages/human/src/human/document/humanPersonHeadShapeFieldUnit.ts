import type { AutoMovieHumanPersonHeadShapeField } from "../structures/AutoMovieHumanPersonHeadShapeField";

/**
 * The public source-neutral difference unit of a closed head trait.
 *
 * Forehead and either pinna inclination are angular differences in degrees;
 * every other registered exterior trait is a millimetre difference. The
 * publisher and resolver share this owner so a source descriptor cannot
 * silently reinterpret the person's number. Authored endpoint magnitude and
 * support remain source-owned, independent of this unit classification.
 */
export function humanPersonHeadShapeFieldUnit(
  field: AutoMovieHumanPersonHeadShapeField,
): "mm" | "degree" {
  return field === "cranial.foreheadInclination" ||
    field === "ears.left.pinnaInclination" ||
    field === "ears.right.pinnaInclination"
    ? "degree"
    : "mm";
}
