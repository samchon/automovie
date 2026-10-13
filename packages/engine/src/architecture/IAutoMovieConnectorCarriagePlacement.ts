import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Where one carriage of a run stands, in world space, at one state.
 *
 * Produced by `builtConnectorCarriagePlacements`, one per carriage in authored
 * order. Without a named state the record's own current state is used. The
 * pose is the carriage element's world matrix with every moving member's
 * displacement for that state applied down the hierarchy; a member whose
 * operation lacks the named state contributes none and stands at its rest
 * transform.
 *
 * @author Samchon
 */
export interface IAutoMovieConnectorCarriagePlacement {
  /** Carriage id inside its connector. */
  carriage: string;

  /** The visible element the carriage drives. */
  element: string;

  /**
   * The staged node id {@link lowerBuiltEnvironment} emits for that element.
   */
  node: string;

  /** World translation of the carriage's element. */
  position: IAutoMovieVector3;

  /** World rotation of the carriage's element, as a unit quaternion. */
  rotation: IAutoMovieQuaternion;

  /** World per-axis scale of the carriage's element. */
  scale: IAutoMovieVector3;

  /**
   * Logical space the state says this carriage serves, or null when it serves
   * none (a counterweight) or the state gives the carriage no entry.
   */
  serves: string | null;
}
