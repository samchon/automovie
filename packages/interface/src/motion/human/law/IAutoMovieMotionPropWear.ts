import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";

/**
 * A planned prop attachment to a humanoid bone beginning at a share of the action's duration. Performance placement applies the attachment after the action's wear event.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A planned prop attachment to a humanoid bone beginning at a share of the action's duration. Performance placement applies the attachment after the action's wear event.
 * @evidence contracts/development/design.md#principled-representation from: Share of this action from which the prop is worn.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Wear-producing action plans publish bone attachments consumed by performance prop placement; the record owns the transition event rather than duplicating a prop's persistent worn configuration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The start is a normalized duration share. Performance placement resolves the prop and bone and captures its attachment transform; no film-second alias is substituted.
 */
export interface IAutoMovieMotionPropWear {
  /** The prop's subject. */
  prop: string;

  /** The bone it rides. */
  bone: AutoMovieHumanoidBone;

  /** Share of this action from which the prop is worn. */
  from: number;
}
