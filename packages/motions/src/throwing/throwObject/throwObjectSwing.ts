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

import { AutoMovieMotionHumanElbowPlace } from "../../compose/AutoMovieMotionHumanElbowPlace";
import { HumanFrame } from "../../posture/HumanFrame";
import { poseBones } from "../../posture/poseBones";
import { resolveHumanPosture } from "../../posture/resolveHumanPosture";

/**
 * The swing of a ball arm.
 *
 * @param body The body.
 * @param side The ball arm.
 * @param style The throw's style.
 * @returns The windup and elbow writers.
 */
export function throwObjectSwing(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  style: IAutoMovieMotionHumanThrowObjectForm.Style,
): throwObjectSwing.ISwing {
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

      // The trunk and the head above it stand as one upright column about
      // the chest, up to the crown and the hand's clearance over it: the
      // line's nearest approach to it is measured across the floor, so a
      // line drawn over the chest, through the face, is caught as one
      // through the trunk is.
      const line: IAutoMovieVector3 = Vector3.subtract(to, from);
      const flat: IAutoMovieVector3 = { x: line.x, y: 0, z: line.z };
      const span: number = Vector3.dot(flat, flat);
      const s: number =
        span > 1e-12
          ? Math.min(
              1,
              Math.max(
                0,
                Vector3.dot(Vector3.subtract(chest, from), flat) / span,
              ),
            )
          : 0;
      const nearest: IAutoMovieVector3 = Vector3.add(
        from,
        Vector3.scale(line, s),
      );
      const away: IAutoMovieVector3 = {
        x: nearest.x - chest.x,
        y: 0,
        z: nearest.z - chest.z,
      };
      const crown: number =
        chest.y +
        body.measure.stature -
        body.measure.chestHeight +
        2 * body.measure.forearmRadius;
      const depth: number = radius - Vector3.length(away);
      if (depth <= 0 || nearest.y > crown) return Vector3.lerp(from, to, u);

      // The detour leaves the column across the floor, at the height the
      // line has there, around the front: an arm carries its hand past the
      // face, never behind the head. A line passing behind the axis is
      // mirrored to the front, and the heading is added by how deep the
      // line enters, so the side turns continuously to straight ahead as
      // the line nears the axis.
      const ahead: IAutoMovieVector3 = HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
        { x: 0, y: 0, z: 1 },
      );
      const behind: number = Math.min(0, Vector3.dot(away, ahead));
      const out: IAutoMovieVector3 = Vector3.normalize(
        Vector3.add(
          Vector3.subtract(away, Vector3.scale(ahead, 2 * behind)),
          Vector3.scale(ahead, depth),
        ),
      );
      const clear: IAutoMovieVector3 = {
        x: chest.x + out.x * radius,
        y: nearest.y,
        z: chest.z + out.z * radius,
      };
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
      return AutoMovieMotionHumanElbowPlace(
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

/**
 * The ball arm's way around the body.
 *
 * The windup carries the hand from where it held the prop to the chamber. A
 * straight line between them may pass through the trunk or the head (a rod held
 * across the body drawn back over the throwing shoulder), so when the line
 * comes nearer the upright column of the trunk and head, measured across the
 * floor from the chest up to the crown, than the chest's half breadth and the
 * forearm's and hand's own thickness (twice the forearm's radius), the hand is
 * carried on a quadratic curve through the point that clearance away from the
 * chest's axis at the line's height there, around the front of the body: the
 * side the line passes when it passes ahead of the axis, turning to straight
 * ahead as the line nears the axis.
 *
 * An underarm bowl swings nearly straight in the plane of the delivery, so its
 * elbow names no side of the line from the shoulder to the wrist and the hand's
 * rotation may flip it. Its elbow is placed (`AutoMovieMotionHumanElbowPlace`)
 * toward the olecranon, which stays behind the arm in that plane: behind it as
 * the arm hangs, below it as it swings ahead, the arm's direction crossed with
 * the performer's right. Other styles keep the elbow their own track found.
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
}
