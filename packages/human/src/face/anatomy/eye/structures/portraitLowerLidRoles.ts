/**
 * The named sections of a lower-lid profile, in sampling order: margin,
 * pretarsalCrest, pretarsalLower, subtarsalInner, subtarsalOuter, preseptal.
 * Read by `createPortraitLowerLidProfile` to lay out the profile's sections.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Names lower-lid tissue offsets separately from anterior surface relief.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Carries millimetre distance from the wet aperture and signed projection over the common depth bridge.
 * @author Samchon
 */
export const portraitLowerLidRoles = [
  "margin",
  "pretarsalCrest",
  "pretarsalLower",
  "subtarsalInner",
  "subtarsalOuter",
  "preseptal",
] as const;
