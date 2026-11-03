import type { IAutoMovieHumanSeam } from "../lofting/IAutoMovieHumanSeam";
import type { AutoMovieHumanTrunkAssembly } from "./AutoMovieHumanTrunkAssembly";

/**
 * The arm's arc of a shoulder ring at one height, published by its owner (the
 * shoulders) for the ring's assembly and for the arm, which copies the arc at
 * the ring's bottom layer: the anterior and posterior axillary guides, on the
 * torso's own folds at the vault and where the arm's ellipse crosses the
 * torso once the arm has merged, the lateral guide at the ellipse's outer
 * extreme and the two sectors between them.
 */
export interface IAutoMovieHumanArmRootArc {
  /** Lateral share of the torso's half width where the anterior guide stands. */
  anterior: number;

  /** Lateral share where the posterior guide stands. */
  posterior: number;

  /**
   * Weight of the torso's own axillary guides and flank rates in the arc's:
   * 1 at the vault, where the ring is the torso's outside the arc, 0 where the
   * arm has merged with the shoulder.
   */
  torso: number;

  /** The jets of the anterior, lateral and posterior guides in the section plane `[x, z]`. */
  guides: [IAutoMovieHumanSeam.IArcJet, IAutoMovieHumanSeam.IArcJet, IAutoMovieHumanSeam.IArcJet];

  /** Arclength rates of the front and the back sector, mm per radian of phase. */
  rates: [number, number];

  /**
   * The front sector, from the anterior to the lateral guide, for the speeds
   * the assembly gives its two guides.
   */
  front: (speeds: readonly [number, number]) => AutoMovieHumanTrunkAssembly.Sector;

  /** The back sector, from the lateral to the posterior guide. */
  back: (speeds: readonly [number, number]) => AutoMovieHumanTrunkAssembly.Sector;
}
