/**
 * Shared by IPortraitLowerLidProfile, createPortraitLowerLidProfile, which were one file until each public identity took its own.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Names lower-lid tissue offsets separately from anterior surface relief.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Carries millimetre distance from the wet aperture and signed projection over the common depth bridge.
 * @author Samchon
 */
export const roles = [
  "margin",
  "pretarsalCrest",
  "pretarsalLower",
  "subtarsalInner",
  "subtarsalOuter",
  "preseptal",
] as const;
