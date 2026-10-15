import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";

/**
 * The head's form coefficients, calibrated against reference heads rather than sculpted.
 *
 * Every value was fitted offline by coordinate descent to the CC0 MakeHuman base mesh with each of eleven pure macro variants applied at full weight (young, old, child and baby; caucasian, asian and african; male and female). Each variant's head length, breadth, circumference, head and face height, face, mandibular and minimum frontal width were measured on its mesh and given to the converter's identity of that sex, age and population; the variant was scaled onto the generated head frame by its landmarks; and the field's skin was compared with the variant's along a grid of rays from the head's centre. The objective is the robust mean square of the radial gaps plus twice that of their second differences across the grid, so a crease or ripple the reference lacks costs as much as an offset, with every coefficient held between half and twice an anatomical starting value; the eyes, the nose and the ears, which their own modules shape, are left out. The fitted field leaves a root mean square gap of 3.6 to 7.4 mm on the vault and 4.1 to 7.4 mm on the face across the eleven variants, much of it from landmarks the skeleton places differently from the reference. No reference geometry is kept, only these numbers. Grade: calibrated against that one CC0 reference set, standing in for the average form between landmarks that no anthropometric survey measures.
 *
 * @author Samchon
 */
export const AUTOMOVIE_HUMAN_HEAD_FORM: IAutoMovieHumanHeadForm = {
  vaultTop: 2.1552,
  vaultForehead: 1.9535,
  vaultBottom: 2.6594,
  mastoid: 0.1373,
  temple: 0.0797,
  orbitRoof: 0.0603,
  recedeStart: 0.6799,
  recedeEnd: 0.8629,
  midfaceFront: 0.0793,
  midfaceTop: 0.0503,
  midfaceBottom: 0.1753,
  cheekExponent: 2.2077,
  midfaceExponent: 2.7004,
  jawLift: 0.1679,
  jawTop: 0.3874,
  jawExponent: 3.0508,
  jawBorder: 3.7088,
  chinWidth: 0.2375,
  jawTaper: 2.9972,
  pogonion: 0.0357,
  chin: 0.0926,
  muzzleMouth: 0.2719,
  muzzleDepth: 0.3112,
  muzzleTop: 0.035,
  muzzleExponent: 1.9375,
  malar: 0.015,
  brow: 0.0227,
  templeHollow: 0.0156,
  gonial: 0.015,
  mental: 0.0125,
  buccal: 0.02,
  buccalGrowth: 0.374,
  blend: 0.1531,
};
