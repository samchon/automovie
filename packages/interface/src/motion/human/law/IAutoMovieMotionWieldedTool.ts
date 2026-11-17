import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A prop wielded by one hand with named working points. Action plans identify the prop and its tip, optional base and edge for downstream striking geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A prop wielded by one hand with named working points. Action plans identify the prop and its tip, optional base and edge for downstream striking geometry.
 * @evidence contracts/development/design.md#principled-representation prop: The prop's subject id. side: The holding hand. tip: The affordance id of its working point: a blade's point, a muzzle, a hammer's face.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A plan publishes its prop, holding hand and working affordance names so another action such as parry or flinch can read the same tool through its context.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The plan names existing prop affordances rather than embedding another geometry model; the action law and performance prop readers own resolution and refusal.
 */
export interface IAutoMovieMotionWieldedTool {
  /** The prop's subject id. */
  prop: string;

  /** The holding hand. */
  side: AutoMovieHumanSide;

  /** The affordance id of its working point: a blade's point, a muzzle, a hammer's face. */
  tip: string;

  /** The affordance the working line runs from toward the tip, when two points define it. */
  from?: string;

  /** The affordance id of its edge or sighting direction, where it has one. */
  edge?: string;
}
