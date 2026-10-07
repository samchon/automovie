import type { IHumanSourcePartRowExclusion } from "./structures/IHumanSourcePartRowExclusion.ts";

const MIDFACE_TRAITS = [
  "facial.leftMalarProjection", "facial.rightMalarProjection",
  "nasalExterior.columellarBreadth", "nasalExterior.columellarProjection",
  "nasalExterior.leftAlarBreadth", "nasalExterior.rightAlarBreadth",
  "nasalExterior.leftAlarHeight", "nasalExterior.rightAlarHeight",
];

/**
 * Attached parts that specific endpoints must leave alone.
 *
 * A rigid part's row is regenerated from the skin point it is bound to, so a
 * skin endpoint that barely grazes that point hands the part a displacement
 * it was never meant to have. Two cases were read from the source census.
 * The under-eye volume endpoints moved the globe by about a millimetre on
 * their negative side although the eye has no reason to follow the lower lid
 * bag. The malar and nasal exterior traits moved the maxillary dentition by
 * no more than a micrometre and left the tongue still, which is binding
 * residue and not a movement of the upper jaw. Both are authored decisions
 * about what these endpoints mean.
 */
export const HUMAN_SOURCE_PART_ROW_EXCLUSIONS: readonly IHumanSourcePartRowExclusion[] = [
  ...["leftEyeBagVolume.negative", "rightEyeBagVolume.negative"].map((endpoint): IHumanSourcePartRowExclusion => ({
    surface: "Human.low-poly", endpoint, reason: "under-eye volume does not move the globe",
  })),
  ...MIDFACE_TRAITS.flatMap((trait) => ["positive", "negative"].map((side): IHumanSourcePartRowExclusion => ({
    surface: "Human.teeth_base", endpoint: `head-source:${trait}:${side}`, reason: "malar and nasal exterior traits do not move the dentition",
  }))),
];
