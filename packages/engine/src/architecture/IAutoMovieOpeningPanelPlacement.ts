import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Where one movable panel stands, in world space, at one operating state.
 *
 * Produced by `builtOpeningPanelPlacements`, one per panel in authored order;
 * without a named state the record's own current state is used, and a state
 * the opening does not declare throws. A state is a configuration, not a
 * moment: a door swinging on screen is a shot motion clip over `node`.
 *
 * @author Samchon
 */
export interface IAutoMovieOpeningPanelPlacement {
  /** Panel id inside its opening. */
  panel: string;

  /** The visible element the panel drives. */
  element: string;

  /**
   * The staged node id {@link lowerBuiltEnvironment} emits for that element.
   */
  node: string;

  /** World translation of the panel's element. */
  position: IAutoMovieVector3;

  /** World rotation of the panel's element, as a unit quaternion. */
  rotation: IAutoMovieQuaternion;

  /** World per-axis scale of the panel's element. */
  scale: IAutoMovieVector3;
}
