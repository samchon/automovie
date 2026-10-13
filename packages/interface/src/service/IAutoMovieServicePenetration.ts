import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One sleeve where a run crosses a boundary of the served environment.
 *
 * A penetration is a first-class record rather than a property of the run
 * because a boundary owns it: a fire compartment wall, a waterproof tanking
 * layer and an acoustic separation each care that the hole exists, how big it
 * is, and whether it was made good.
 */
export interface IAutoMovieServicePenetration {
  /** Stable penetration identity within the network. */
  id: string;

  /**
   * Id of the boundary of the served environment this sleeve is cut through.
   */
  boundary: string;

  /**
   * Id of the declared opening of that boundary the sleeve passes through, or
   * `null` when the sleeve is a bare cored hole.
   *
   * Citing one is a stronger claim than citing the boundary alone: where that
   * opening states a profile, the sleeve is held inside the void it names
   * rather than merely somewhere on the same wall.
   */
  opening: string | null;

  /**
   * World position of the sleeve centre, in metres.
   *
   * Where the pierced boundary declares a face, this is read in that boundary's
   * own frame and held inside its outline and its thickness. Where it declares
   * none, the position is only held against the runs that cite the sleeve, and
   * `serviceAnalysisSupport` reports the difference by name.
   */
  position: IAutoMovieVector3;

  /** Clear radius of the sleeve in metres; greater than `0`. */
  radius: number;

  /**
   * Whether the annulus around the run was made good — fire-stopped, tanked or
   * gasketed. A sleeve through a waterproof membrane that is not sealed is a
   * leak the render cannot show.
   */
  sealed: boolean;
}
