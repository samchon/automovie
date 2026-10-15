import { IAutoMovieHumanTrunkForm } from "./IAutoMovieHumanTrunkForm";

/**
 * The trunk's form coefficients for the human profile.
 *
 * Fitted by least squares against MakeHuman CC0 reference bodies (the hm08 base mesh with its CC0 macro targets, CC0 1.0, makehumancommunity/makehuman at a8bc2d54) for the four lean 20-year-old gate identities, retargeted onto our skeleton by the shared calibration harness. Each reference was first measured like anthropometry at our own levels (convex-hull tape girths, breadths and depths at the buttock, natural waist, costal arch and chest point), and our trunk was generated for identities carrying those measurements, so the fit compares shape alone: the residual is the radial distance between our level section and the reference's, 72 rays about the reference section's midline centre, every 10 mm from the buttock level to the axilla. Grade: fitted to a CC0 reference.
 */
export const AUTOMOVIE_HUMAN_TRUNK_FORM: IAutoMovieHumanTrunkForm = {
  buttock: { behind: 0.46, widest: 0.68, skew: -0.3 },
  hip: { level: 0.45, breadth: 0.98 },
  crest: {
    behind: 0.36,
    widest: 0.45,
    depth: 0.8,
    breadth: 0.9,
    front: 2.1,
    back: 2.8,
  },
  waist: { behind: 0.28, widest: 0.5, skew: -0.06 },
  underbust: { behind: 0.22, widest: 0.5, skew: 0, depth: 0.35, breadth: 0.18 },
  chest: { behind: 0.21, widest: 0.45, skew: 0.1 },
  axilla: {
    behind: 0.22,
    widest: 0.42,
    depth: 1,
    breadth: 1.06,
    front: 3,
    back: 3,
  },
  gluteal: { front: 0.85, back: 0.22 },
};
