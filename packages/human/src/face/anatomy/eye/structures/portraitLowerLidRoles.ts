/**
 * The named sections of a lower-lid profile, in sampling order: margin,
 * pretarsalCrest, pretarsalLower, subtarsalInner, subtarsalOuter, preseptal.
 * Read by `createPortraitLowerLidProfile` to lay out the profile's sections.
 *
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
