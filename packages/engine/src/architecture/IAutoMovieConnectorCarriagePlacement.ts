import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/** Where one carriage of a run stands, in world space, at one state. */
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
  /** Logical space this carriage stands at in that state, or null. */
  serves: string | null;
}
