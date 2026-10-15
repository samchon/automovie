import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";

/**
 * The head's form coefficients, calibrated against reference heads rather than sculpted.
 *
 * Every value was fitted offline by coordinate descent to the CC0 MakeHuman base mesh with each of eleven pure macro variants applied at full weight (young, old, child and baby; caucasian, asian and african; male and female). Each variant's head length, breadth, circumference, head and face height, face, mandibular and minimum frontal width were measured on its mesh and given to the converter's identity of that sex, age and population; the variant was scaled onto the generated head frame by its landmarks; and the field's skin was compared with the variant's along a grid of rays from the head's centre. The objective is the robust mean square of the radial gaps plus twice that of their second differences across the grid, so a crease or ripple the reference lacks costs as much as an offset, with every coefficient held between half and twice an anatomical starting value; the eyes, the nose and the ears, which their own modules shape, are left out. This set is the block-out: the relief coefficients are held at zero while the masses are fitted. The shared MakeHuman harness scores it at a mean radial gap of 5.6 mm (mean silhouette overlap 0.90) for the default adult woman and 7.1 mm (0.88) for the default adult man, most of the remainder from head dimensions the identity takes from measured surveys where the reference differs. No reference geometry is kept, only these numbers. Grade: calibrated against that one CC0 reference set, standing in for the average form between landmarks that no anthropometric survey measures.
 *
 * @author Samchon
 */
export const AUTOMOVIE_HUMAN_HEAD_FORM: IAutoMovieHumanHeadForm = {
  vaultTop: 2.1552,
  vaultForehead: 1.9535,
  vaultBottom: 2.5117,
  mastoid: 0.1371,
  temple: 0.129,
  orbitRoof: 0.0655,
  recedeStart: 0.8624,
  recedeEnd: 0.9114,
  midfaceFront: 0.0598,
  midfaceTop: 0.0996,
  midfaceBottom: 0.2238,
  cheekExponent: 2.0054,
  midfaceExponent: 2.2169,
  jawLift: 0.2008,
  jawTop: 0.3659,
  jawExponent: 2.7172,
  jawBorder: 3.8479,
  chinWidth: 0.2019,
  jawTaper: 5.3238,
  pogonion: 0.0303,
  chin: 0.0926,
  muzzleMouth: 0.2518,
  muzzleDepth: 0.3596,
  muzzleTop: 0.035,
  muzzleExponent: 1.4289,
  malar: 0,
  brow: 0,
  templeHollow: 0,
  gonial: 0,
  mental: 0,
  buccal: 0,
  buccalGrowth: 0,
  blend: 0.1588,
};
