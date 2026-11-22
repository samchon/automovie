import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanThrowObjectForm,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanElbowPlace } from "../compose/AutoMovieMotionHumanElbowPlace";
import { HumanFrame } from "../posture/HumanFrame";

/**
 * The ball arm of an underarm bowl swings nearly straight in the plane of
 * the delivery, so its elbow names no side of the line from the shoulder to
 * the wrist and the hand's rotation may flip it. Its elbow is placed
 * (`AutoMovieMotionHumanElbowPlace`) toward the olecranon, which stays
 * behind the arm in that plane: behind it as the arm hangs, below it as it
 * swings ahead, the arm's direction crossed with the performer's right.
 * Other styles keep the elbow their own track found.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why the bowl's elbow is placed, toward what, and the other styles.
 * @evidence contracts/development/design.md#principled-representation The goal's placed elbow with the swing plane's olecranon as its pole.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One writer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pole follows the arm and the heading, never a fixed vector.
 */
export namespace throwObjectSwing {
  /** A writer of the ball arm's elbow into its goal, given the posture written into. */
  export type Elbow = (
    posture: IAutoMovieMotionHumanPosture,
    goal: IAutoMovieHumanLimbGoal,
  ) => IAutoMovieHumanLimbGoal;

  /**
   * The ball arm's elbow writer for a style.
   *
   * @param body The body.
   * @param side The ball arm.
   * @param style The throw's style.
   * @returns For a bowl, a writer that places the elbow toward the olecranon; otherwise one that leaves the goal as it is.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the two writers.
   * @evidence contracts/development/implementation.md#principled-implementation The olecranon as the arm's direction crossed with the heading's right.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One style test, one placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the bowl is changed.
   * @evidence contracts/development/implementation.md#efficient-algorithms One shoulder FK a sample for a bowl.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared elbow placement.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the body and side.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    style: IAutoMovieMotionHumanThrowObjectForm.Style,
  ): Elbow {
    if (style !== "bowling")
      return (
        _: IAutoMovieMotionHumanPosture,
        goal: IAutoMovieHumanLimbGoal,
      ): IAutoMovieHumanLimbGoal => goal;
    return (
      posture: IAutoMovieMotionHumanPosture,
      goal: IAutoMovieHumanLimbGoal,
    ): IAutoMovieHumanLimbGoal => {
      const right: IAutoMovieVector3 = HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
        { x: -1, y: 0, z: 0 },
      );
      return AutoMovieMotionHumanElbowPlace.of(
        body,
        posture,
        side,
        goal,
        (along: IAutoMovieVector3): IAutoMovieVector3 =>
          Vector3.cross(along, right),
      );
    };
  }
}
