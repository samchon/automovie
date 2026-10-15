import { IAutoMovieHumanTrunkForm } from "./IAutoMovieHumanTrunkForm";

/**
 * The trunk's form coefficients for the human profile.
 *
 * Fitted by least squares against reference bodies, the four nearest the lean 20-year-old gate identities (two lean young women, a lean young man and a muscular young man), each mapped onto our skeleton for the identity by its own skin weights in the shared calibration harness. Each reference was first measured like anthropometry at our own levels (convex-hull tape girths, breadths and depths at the buttock, natural waist, costal arch and chest point), and our trunk was generated for identities carrying those measurements, so the fit compares shape alone: the residual is the radial distance between our level section and the reference's, 72 rays about the reference section's midline centre, every 10 mm from the buttock level to the axilla; the profile's mean residual is 3.5 to 4.9 mm per body. The crotch and gluteal furrow levels, where the section is two thighs side by side, are the mean outer contour of the same reference sections (foremost and rearmost points and breadth over both thighs), and the clavicle level is the foremost and rearmost points 40 to 100 mm beside the midline 8 mm below the jugular notch; fronts are regressed on body fat. The back's midline lies 0.30 of the chest depth behind the column at the chest, about 65 mm in a lean man. Grade: fitted to reference bodies.
 */
export const AUTOMOVIE_HUMAN_TRUNK_FORM: IAutoMovieHumanTrunkForm = {
  buttock: {
    behind: 0.5655,
    fat: -0.0011,
    widest: 0.7507,
    skew: -0.5078,
  },
  hip: {
    level: 0.7672,
    breadth: 0.8943,
  },
  crest: {
    behind: 0.4232,
    fat: -0.0029,
    widest: 0.5261,
    depth: 0.686,
    breadth: 0.7339,
    front: 1.4418,
    back: 2.8781,
  },
  waist: {
    behind: 0.3696,
    fat: -0.0064,
    widest: 0.5004,
    skew: -0.434,
  },
  underbust: {
    behind: 0.2915,
    fat: -0.0044,
    widest: 0.3974,
    front: 2.1954,
    back: 3.0604,
    depth: 0.1106,
  },
  chest: {
    behind: 0.2969,
    fat: -0.0081,
    widest: 0.2858,
    front: 2.1949,
    back: 2.6364,
  },
  axilla: {
    behind: 0.306,
    fat: -0.0059,
    widest: 0.2748,
    depth: 0.992,
    breadth: 1.1052,
    front: 3.3999,
    back: 3.0489,
  },
  clavicle: {
    front: 0.212,
    fat: -0.0015,
    back: 0.128,
  },
  crotch: {
    front: 0.996,
    fat: -0.0046,
    back: 0.04,
    breadth: 1.031,
    recess: 0.16,
  },
  gluteal: {
    front: 0.987,
    fat: -0.0013,
    back: 0.082,
    breadth: 1.041,
  },
};
