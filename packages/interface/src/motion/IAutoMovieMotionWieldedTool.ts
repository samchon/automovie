import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * A prop wielded by one hand with named working points. Action plans identify
 * the prop and its tip, optional base and edge for downstream striking
 * geometry.
 */
export interface IAutoMovieMotionWieldedTool {
  /** The prop's subject id. */
  prop: string;

  /** The holding hand. */
  side: AutoMovieHumanSide;

  /**
   * The affordance id of its working point: a blade's point, a muzzle, a
   * hammer's face.
   */
  tip: string;

  /**
   * The affordance the working line runs from toward the tip, when two points
   * define it.
   */
  from?: string;

  /** The affordance id of its edge or sighting direction, where it has one. */
  edge?: string;
}
