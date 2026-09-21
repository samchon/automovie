/**
 * The review states that exercise the individuality channels: each trait
 * alone at its extremes, and the trait combinations a real body wears
 * together with the macros they meet. Shared by the build and census
 * scripts so the states one reviews are the states the census reads.
 */

/** Trait states worth a frame: one at a time, then combined on the macros they meet. */
export const REVIEW: Record<string, Record<string, number>> = {
  "ptosis-sag": { buttocksPtosis: 1 },
  "ptosis-lift": { buttocksPtosis: -1 },
  overhang: { stomachOverhang: 1 },
  "flank-fat": { flankFat: 1 },
  "outer-thigh-fat": { outerThighFatLeft: 1, outerThighFatRight: 1 },
  "hip-dip": { hipDipLeft: 1, hipDipRight: 1 },
  "hip-fill": { hipDipLeft: -1, hipDipRight: -1 },
  "abs-definition": { absDefinition: 1 },
  "deltoid-definition": { deltoidDefinitionLeft: 1, deltoidDefinitionRight: 1 },
  "scapular-definition": { scapularDefinition: 1 },
  "heavy-sagging": {
    macroWeight: 1,
    macroAge: 0.5,
    buttocksPtosis: 1,
    stomachOverhang: 1,
    flankFat: 1,
    outerThighFatLeft: 1,
    outerThighFatRight: 1,
  },
  "lean-defined": {
    macroWeight: -0.6,
    macroMuscle: 0.8,
    buttocksPtosis: -1,
    absDefinition: 1,
    deltoidDefinitionLeft: 1,
    deltoidDefinitionRight: 1,
    scapularDefinition: 1,
  },
  "female-pear": {
    macroGender: -1,
    outerThighFatLeft: 1,
    outerThighFatRight: 1,
    hipDipLeft: 1,
    hipDipRight: 1,
  },
};
