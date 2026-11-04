import type { IAutoMovieHumanSeam } from "../../lofting/IAutoMovieHumanSeam";

/**
 * One side of a web's patch as its owner publishes it: the owner's surface
 * jet along the seam the patch shares with it (rule J4 of the shared seam
 * module), over a stretch of the owner's own seam parameter, with the
 * continuity the patch must reach there.
 *
 * A hand's web has four owners: the palm's ring arc (bottom), the two digits'
 * root side lines (right and left) and the crest (top), each publishing its
 * jet with `across` pointing into the patch. A toe's web is the same patch
 * with the foot's owners: the foot publishes the same interface for its web
 * boundaries, so one patch construction serves both.
 */
export interface IAutoMovieHumanWebBoundary {
  /** Owner's name in findings, such as `hand.left.1`. */
  owner: string;

  /** The owner's surface jet at its seam parameter, `across` pointing into the patch. */
  jet: (a: number) => IAutoMovieHumanSeam.ISurfaceJet;

  /** Seam parameter at the side's start. */
  from: number;

  /** Seam parameter at the side's end; below `from` runs the seam backward. */
  to: number;

  /** Share of the owner's cross derivative the patch leaves along, positive. */
  alpha: number;

  /** Share of the seam's own tangent the patch leans along it, per unit of the owner's parameter. */
  beta: number;

  /** The continuity the patch reaches with this owner, G1 or G2. */
  continuity: "G1" | "G2";
}
