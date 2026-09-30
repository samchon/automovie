import type { IAutoMovieHumanBodyUnderwear } from "../structures/IAutoMovieHumanBodyUnderwear";

/**
 * The regions of the plain default underwear, placed on the shipped basis's
 * landmarks (MPFB joint cubes, and for the bra the left nipple-areola fill's
 * centre vertex, the skin landmark the bust girth is measured at).
 *
 * The fractions were set by rendering the neutral, female, male, child and
 * heavy bodies at rest and in the editor's pose presets, not measured from a
 * garment standard: the underwear is a blocking-pass costume, the look of a
 * game character's default underwear, not a fitted product. The waistband
 * sits just below the navel; the boxer briefs' legs end a third of the way
 * down the thigh; the briefs' leg line rises from the crotch to above the
 * hip joint; the bra's band runs under the breasts, and its upper edge is
 * higher in front than behind, with a strap over each shoulder.
 */
export const HUMAN_BODY_UNDERWEAR: IAutoMovieHumanBodyUnderwear.ITable = {
  material: "underwear",
  color: { r: 0.62, g: 0.62, b: 0.6 },
  roughness: 0.85,
  offsetMetres: 0.003,
  uncovered: ["leftUpperArm", "rightUpperArm"],
  landmarks: {
    pelvis: "joint-pelvis",
    lumbar: "joint-spine-4",
    lowerChest: "joint-spine-3",
    clavicle: "joint-l-clavicle",
    shoulder: "joint-l-shoulder",
    hips: { left: "joint-l-upper-leg", right: "joint-r-upper-leg" },
    knees: { left: "joint-l-knee", right: "joint-r-knee" },
  },
  briefs: {
    "boxer-briefs": {
      waist: 0.9,
      crotch: 0.3,
      front: 0.3,
      back: 0.3,
      gusset: 0.3,
      outer: 1.6,
    },
    "bra-and-briefs": {
      waist: 0.7,
      crotch: 0.2,
      front: -0.08,
      back: 0.1,
      gusset: 0.3,
      outer: 1.6,
    },
  },
  bra: {
    nipple: { surface: 0, vertex: 21898 },
    bottom: 0.55,
    front: 0.45,
    back: 0.1,
    strap: 0.45,
    strapHalfWidth: 0.08,
  },
};
