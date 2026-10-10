import type { IAutoMovieHumanBodyShoulderPose } from "../IAutoMovieHumanBodyShoulderPose";
import type { IAutoMovieHumanBodyShoulderRange } from "./IAutoMovieHumanBodyShoulderRange";

/**
 * A source upper arm's TT authoring contract, preserving the existing neutral direction and plane-dependent reach.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyShoulderContract {
  /** Existing thorax-relative tilt/torsion convention. */
  coordinates: "thorax-tt";

  /** Source A-pose TT direction and axial zero, in the same units as the existing goal without its bone identity. */
  neutral: Omit<IAutoMovieHumanBodyShoulderPose, "bone">;

  /** Existing total-elevation, rotation and plane-envelope admission. */
  range: IAutoMovieHumanBodyShoulderRange;
}
