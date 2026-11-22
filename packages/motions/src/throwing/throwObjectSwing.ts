import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanThrowObjectForm,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanElbowPlace } from "../compose/AutoMovieMotionHumanElbowPlace";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The ball arm's way around the body.
 *
 * The windup carries the hand from where it held the prop to the chamber.
 * A straight line between them may pass through the trunk (a rod held
 * across the body drawn back over the throwing shoulder), so when the line
 * comes nearer the chest than its half breadth and the forearm's and hand's
 * own thickness (twice the forearm's radius), the hand is
 * carried on a quadratic curve through the point that clearance away from
 * the chest, on the side the line passes.
 *
 * An underarm bowl swings nearly straight in the plane of the delivery, so
 * its elbow names no side of the line from the shoulder to the wrist and
 * the hand's rotation may flip it. Its elbow is placed
 * (`AutoMovieMotionHumanElbowPlace`) toward the olecranon, which stays
 * behind the arm in that plane: behind it as the arm hangs, below it as it
 * swings ahead, the arm's direction crossed with the performer's right.
 * Other styles keep the elbow their own track found.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the windup's detour and when it applies, and the bowl's placed elbow.
 * @evidence contracts/development/design.md#principled-representation A curve through a clearance point; the goal's placed elbow with the swing plane's olecranon as its pole.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The swing's two writers and their maker.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The chest and its breadth are the body's own; the pole follows the arm and the heading.
 */
export namespace throwObjectSwing {
  /** The swing's writers. */
  export interface ISwing {
    /**
     * The windup's grip point.
     *
     * @param posture The posture the arm is written into.
     * @param from Where the grip starts, world metres.
     * @param to The chamber, world metres.
     * @param u The windup's progress, 0 to 1.
     * @returns World metres.
     */
    windup(
      posture: IAutoMovieMotionHumanPosture,
      from: IAutoMovieVector3,
      to: IAutoMovieVector3,
      u: number,
    ): IAutoMovieVector3;

    /**
     * The ball arm's goal with its elbow placed for a bowl.
     *
     * @param posture The posture the goal is written into.
     * @param goal The arm goal from the throw's track.
     * @returns The goal.
     */
    elbow(
      posture: IAutoMovieMotionHumanPosture,
      goal: IAutoMovieHumanLimbGoal,
    ): IAutoMovieHumanLimbGoal;
  }

  /**
   * The swing of a ball arm.
   *
   * @param body The body.
   * @param side The ball arm.
   * @param style The throw's style.
   * @returns The windup and elbow writers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the writers.
   * @evidence contracts/development/implementation.md#principled-implementation The line's nearest approach to the chest decides the detour; the curve passes the clearance point at its middle. The olecranon is the arm's direction crossed with the heading's right.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two writers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A line clear of the chest is kept straight; only the bowl's elbow is placed.
   * @evidence contracts/development/implementation.md#efficient-algorithms One chest FK a windup sample, one shoulder FK a bowl sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared elbow placement and the pose reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the body, side and style.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    style: IAutoMovieMotionHumanThrowObjectForm.Style,
  ): ISwing {
    // The hand passes clear of the chest by the forearm's radius and the
    // hand's half thickness, the wrist's own radius standing for it.
    const radius: number =
      body.measure.chestBreadth / 2 + 2 * body.measure.forearmRadius;
    return {
      windup: (
        posture: IAutoMovieMotionHumanPosture,
        from: IAutoMovieVector3,
        to: IAutoMovieVector3,
        u: number,
      ): IAutoMovieVector3 => {
        const chest: IAutoMovieVector3 = poseBones(
          body,
          resolveHumanPosture(body, { ...posture, limbs: {} }),
          undefined,
          new Set<AutoMovieHumanoidBone>(["chest"]),
        ).get("chest")!.worldPosition;
        const line: IAutoMovieVector3 = Vector3.subtract(to, from);
        const span: number = Vector3.dot(line, line);
        const s: number =
          span > 1e-12
            ? Math.min(
                1,
                Math.max(
                  0,
                  Vector3.dot(Vector3.subtract(chest, from), line) / span,
                ),
              )
            : 0;
        const away: IAutoMovieVector3 = Vector3.subtract(
          Vector3.add(from, Vector3.scale(line, s)),
          chest,
        );
        if (Vector3.length(away) >= radius) return Vector3.lerp(from, to, u);
        const out: IAutoMovieVector3 =
          Vector3.length(away) > 1e-9
            ? Vector3.normalize(away)
            : { x: 0, y: 1, z: 0 };
        const clear: IAutoMovieVector3 = Vector3.add(
          chest,
          Vector3.scale(out, radius),
        );
        // A quadratic through `clear` at its middle.
        const control: IAutoMovieVector3 = Vector3.subtract(
          Vector3.scale(clear, 2),
          Vector3.scale(Vector3.add(from, to), 0.5),
        );
        return Vector3.add(
          Vector3.add(
            Vector3.scale(from, (1 - u) * (1 - u)),
            Vector3.scale(control, 2 * u * (1 - u)),
          ),
          Vector3.scale(to, u * u),
        );
      },
      elbow: (
        posture: IAutoMovieMotionHumanPosture,
        goal: IAutoMovieHumanLimbGoal,
      ): IAutoMovieHumanLimbGoal => {
        if (style !== "bowling") return goal;
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
      },
    };
  }
}
