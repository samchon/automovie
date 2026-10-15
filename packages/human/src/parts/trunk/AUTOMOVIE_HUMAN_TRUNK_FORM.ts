import { IAutoMovieHumanTrunkForm } from "./IAutoMovieHumanTrunkForm";

/**
 * The trunk's form coefficients for the human profile.
 *
 * Fitted by least squares against MakeHuman CC0 reference bodies (the hm08 base mesh with its CC0 macro targets, CC0 1.0, makehumancommunity/makehuman at a8bc2d54) for the four lean 20-year-old gate identities, retargeted onto our skeleton by the shared calibration harness. Each reference was first measured like anthropometry at our own levels (convex-hull tape girths, breadths and depths at the buttock, natural waist, costal arch and chest point), and our trunk was generated for identities carrying those measurements, so the fit compares shape alone: the residual is the radial distance between our level section and the reference's, 72 rays about the reference section's midline centre, every 10 mm from the buttock level to the axilla. The crotch and gluteal furrow levels, where the section is two thighs side by side, are the mean outer contour of the same reference sections (foremost and rearmost points and breadth over both thighs), and the clavicle level is the foremost and rearmost points 40 to 100 mm beside the midline 8 mm below the jugular notch, the front regressed on body fat; these are not fitted by rays. Grade: fitted to a CC0 reference.
 */
export const AUTOMOVIE_HUMAN_TRUNK_FORM: IAutoMovieHumanTrunkForm = {
  buttock: {
    behind: 0.4775,
    fat: 0.0074,
    widest: 0.675,
    skew: 0.0018,
  },
  hip: {
    level: 0.9,
    breadth: 0.8646,
  },
  crest: {
    behind: 0.3589,
    fat: 0.0081,
    widest: 0.5254,
    depth: 0.9478,
    breadth: 0.8304,
    front: 2.1117,
    back: 2.7393,
  },
  waist: {
    behind: 0.2626,
    fat: -0.0035,
    widest: 0.5315,
    skew: -0.425,
  },
  underbust: {
    behind: 0.2382,
    fat: -0.004,
    widest: 0.582,
    skew: -0.2059,
    depth: 0.4095,
    breadth: 0.1708,
  },
  chest: {
    behind: 0.2101,
    fat: -0.0081,
    widest: 0.4179,
    skew: 0.0327,
  },
  axilla: {
    behind: 0.2264,
    fat: -0.0085,
    widest: 0.4618,
    depth: 0.9743,
    breadth: 1.063,
    front: 3.7839,
    back: 3.5086,
  },
  clavicle: {
    front: 0.186,
    fat: 0.0092,
    back: 0.07,
  },
  crotch: {
    front: 0.95,
    fat: 0.009,
    back: 0.075,
    breadth: 0.97,
    recess: 0.16,
  },
  gluteal: {
    front: 0.945,
    fat: 0.009,
    back: 0.12,
    breadth: 0.95,
  },
};
