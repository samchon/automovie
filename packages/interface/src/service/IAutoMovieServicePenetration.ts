import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One sleeve where a run crosses a boundary of the served environment.
 *
 * A penetration is a first-class record rather than a property of the run because a boundary owns it: a fire compartment wall, a waterproof tanking layer and an acoustic separation each care that the hole exists, how big it is, and whether it was made good.
 *
 * @evidence contracts/common.md#principled-implementation Explicit sleeve identity joins a run to its environment boundary; where a boundary face and opening profile exist, position and positive radius are held inside their geometric void and thickness.
 * @evidence contracts/common.md#clear-and-simple-design Boundary-owned penetration is separate from segment route so fire, acoustic and waterproof closure share one authored hole record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A faceless boundary permits only run-relative checks and reports unsupported geometric proof; sealed is an authored assertion rather than a simulated leakage result.
 * @evidence contracts/common.md#meaningful-documentation Defines boundary and optional opening ownership, world-meter center, positive clearance radius and sealed-annulus purpose with missing-face limits.
 * @author Samchon
 */
export interface IAutoMovieServicePenetration {
  /** Stable penetration identity within the network. */
  id: string;

  /**
   * Id of the boundary of the served environment this sleeve is cut through.
   */
  boundary: string;

  /**
   * Id of the declared opening of that boundary the sleeve passes through, or `null` when the sleeve is a bare cored hole.
   *
   * Citing one is a stronger claim than citing the boundary alone: where that opening states a profile, the sleeve is held inside the void it names rather than merely somewhere on the same wall.
   */
  opening: string | null;

  /**
   * World position of the sleeve centre, in metres.
   *
   * Where the pierced boundary declares a face, this is read in that boundary's own frame and held inside its outline and its thickness. Where it declares none, the position is only held against the runs that cite the sleeve, and `serviceAnalysisSupport` reports the difference by name.
   */
  position: IAutoMovieVector3;

  /** Clear radius of the sleeve in metres; greater than `0`. */
  radius: number;

  /**
   * Authored assertion that the annulus is closed, for example by fire-stopping, tanking or gasketing. Validation can require that declaration; it does not simulate actual leakage or prove installed closure.
   */
  sealed: boolean;
}
