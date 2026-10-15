import { IAutoMovieHumanTrunkForm } from "./IAutoMovieHumanTrunkForm";

/**
 * The trunk's form coefficients for the human profile.
 *
 * Fitted by least squares against MakeHuman CC0 reference bodies (the hm08 base mesh with its CC0 macro targets, CC0 1.0, makehumancommunity/makehuman at a8bc2d54) for the four lean 20-year-old gate identities, retargeted onto our skeleton by the shared calibration harness. Each reference was first measured like anthropometry at our own levels (convex-hull tape girths, breadths and depths at the buttock, natural waist, costal arch and chest point), and our trunk was generated for identities carrying those measurements, so the fit compares shape alone: the residual is the radial distance between our level section and the reference's, 72 rays about the reference section's midline centre, every 10 mm from the buttock level to the axilla. The crotch and gluteal furrow levels, where the section is two thighs side by side, are the mean outer contour of the same reference sections (foremost and rearmost points and breadth over both thighs), not fitted by rays. Grade: fitted to a CC0 reference.
 */
export const AUTOMOVIE_HUMAN_TRUNK_FORM: IAutoMovieHumanTrunkForm = {
  buttock: {
    behind: 0.4761,
    fat: 0.0076,
    widest: 0.6641,
    skew: 0.0795,
  },
  hip: {
    level: 0.8999,
    breadth: 0.8652,
  },
  crest: {
    behind: 0.345,
    fat: 0.0066,
    widest: 0.5505,
    depth: 0.9219,
    breadth: 0.845,
    front: 1.9493,
    back: 2.8722,
  },
  waist: {
    behind: 0.2705,
    fat: -0.0022,
    widest: 0.5108,
    skew: -0.3653,
  },
  underbust: {
    behind: 0.2422,
    fat: -0.0035,
    widest: 0.5669,
    skew: -0.1346,
    depth: 0.3856,
    breadth: 0.201,
  },
  chest: {
    behind: 0.2177,
    fat: -0.0072,
    widest: 0.4068,
    skew: 0.0418,
  },
  axilla: {
    behind: 0.2354,
    fat: -0.0073,
    widest: 0.44,
    depth: 0.9612,
    breadth: 1.0699,
    front: 4.0314,
    back: 3.4077,
  },
  crotch: {
    front: 0.95,
    back: 0.075,
    breadth: 0.97,
    frontRecess: 0.06,
    backRecess: 0.16,
  },
  gluteal: {
    front: 0.95,
    back: 0.12,
    breadth: 0.95,
  },
};
