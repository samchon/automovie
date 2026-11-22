import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * A two-hand sports-stick action layered on the authored standing or moving support.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The kind determines its actual tool contact, custody change and support requirements.
 * @evidence contracts/development/design.md#principled-representation One named stick and ball per action, with a declared direction and an explicitly timed contact.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The dedicated sport law owns reach, its tool frame and required model affordances.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contract names model props and a canonical scene aim target.
 */
export namespace IAutoMovieMotionHumanStickBall {
  /**
   * The actual working contact of the action. Field hockey pushes a sphere
   * with the blade, ice hockey pushes the puck at its radial rim, and the
   * lacrosse variants stage pocket acquisition and release.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the tool contact and change of custody for each case.
   * @evidence contracts/development/design.md#principled-representation The literal discriminant separates surface contact, pocket capture and release.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The sport planner reads this one choice to select the working affordance and effect.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Leaves timing, placement and geometry to the planner and the named model affordances.
   */
  export type Kind =
    | "fieldHockey"
    | "iceHockey"
    | "lacrosseScoop"
    | "lacrossePass";

  /**
   * The timing, identity and intended direction of a stick action.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each parameter states its unit, scope and default.
   * @evidence contracts/development/design.md#principled-representation The closed action kind selects the contact geometry, and the named props supply its dimensions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The planner requires only kind, stick and ball.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Wear, custody, support and prop identity use existing owners.
   */
  export interface IParams {
    /** The stick's role in the play. */
    kind: Kind;

    /** The stick subject, with a shaft grip and the selected working affordance. */
    stick: string;

    /** The acted-on ball or puck subject. */
    ball: string;

    /** The destination direction, read from this target at contact. Defaults to the performer's heading. */
    target?: IAutoMovieMotionTarget;

    /** The hand closer to the stick head. Defaults to right. */
    hand?: "left" | "right";

    /** Duration in seconds. Defaults to 0.75 s. */
    duration?: number;

    /** The release speed in m/s for a pass. The scoop retains the ball. */
    speed?: number;
  }
}
