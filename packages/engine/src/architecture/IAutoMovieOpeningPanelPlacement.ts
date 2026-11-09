import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * Where one movable panel stands, in world space, at one operating state.
 *
 * Produced by `builtOpeningPanelPlacements`, one per panel in authored order;
 * without a named state the record's own current state is used, and a state
 * the opening does not declare throws. A state is a configuration, not a
 * moment: a door swinging on screen is a shot motion clip over `node`. The
 * named state is applied to every opening and run that declares it, so an
 * ancestor leaf displaced by that state carries this panel with it.
 *
 * @evidence contracts/development/design.md#principled-representation Composes the panel element's world affine matrix with state displacements, then decomposes it to translation, normalized rotation and scale. Meaningful TRS correspondence requires finite, representable world TRS; staged validation checks a numerical round trip, while this record does not represent arbitrary shear.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Names the panel, its element and staged node beside the world pose, so a shot can stage the configuration or animate the node without another lookup; it carries no served space because an opening serves none.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A state is a configuration, not a clock, so motion over time is left to the shot's object motions rather than simulated here, and a member lacking the state stands at rest.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer and order, the default state, the refusal of an undeclared state, that the state applies to every opening and run declaring it, the node id format and the world units of the pose.
 */
export interface IAutoMovieOpeningPanelPlacement {
  /** Panel id inside its opening. */
  panel: string;

  /** The visible element the panel drives. */
  element: string;

  /**
   * The staged node id {@link lowerBuiltEnvironment} emits for that element,
   * `"<environment id>/<element id>"`.
   */
  node: string;

  /** World translation of the panel's element. */
  position: IAutoMovieVector3;

  /** World rotation of the panel's element, as a unit quaternion. */
  rotation: IAutoMovieQuaternion;

  /** World per-axis scale of the panel's element. */
  scale: IAutoMovieVector3;
}
