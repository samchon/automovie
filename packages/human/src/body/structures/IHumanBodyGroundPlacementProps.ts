import type { IAutoMovieHumanBodyBasis } from "./IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBuild } from "./IAutoMovieHumanBodyBuild";

/**
 * The evaluated body and its source ground/foot registration for vertical
 * placement. The source floor remains in its rest frame.
 *
 * @author Samchon
 */
export interface IHumanBodyGroundPlacementProps {
  /** Basis that owns the ground landmark and foot attachment regions. */
  basis: IAutoMovieHumanBodyBasis;

  /** Actual final posed surfaces and the static model derived from them. */
  build: IAutoMovieHumanBodyBuild;
}
