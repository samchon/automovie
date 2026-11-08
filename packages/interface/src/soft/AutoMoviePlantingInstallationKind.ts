/**
 * Semantic planting-installation category used by architecture binding admission.
 *
 * @evidence contracts/development/design.md#principled-representation Closed categories distinguish supported installation obligations: green-wall refuses the surface arm and requires an element or boundary reference, while aquatic requires explicit fluid ownership. The green-wall rule does not inspect the referenced geometry's orientation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Category stays on the building binding rather than the independent branching recipe or placement cluster.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Kind selects binding validation, not a species preset or derived plant geometry; other remains an authored category with ordinary reference admission.
 * @evidence contracts/development/common.md#meaningful-documentation Defines supported installation roles and their separate architectural binding responsibility.
 */
export type AutoMoviePlantingInstallationKind =
  | "potted"
  | "planter"
  | "green-wall"
  | "aquatic"
  | "other";
