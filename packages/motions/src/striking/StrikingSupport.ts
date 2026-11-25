import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingBlade,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { StrikingHeld } from "./StrikingHeld";

/**
 * The other hand's goal on a tool held in both hands, shared by a stroke, its
 * decisive-pose judgement and the demands an earlier grasp must hold. A support
 * hand being replanned is judged at its new goal, not left as an obstacle at
 * the previous action's handle.
 */
export namespace StrikingSupport {
  /**
   * Where the supporting hand grips a held tool: the support's offset laid
   * along the tool's axis, its edge and their cross product, in the hand's
   * frame, from the held point.
   *
   * @param frame The held point and the hand's attitude.
   * @param tool The tool's axis and edge, in the hand's frame.
   * @param offset The support's offset along axis, edge and their cross,
   *   metres.
   * @returns World metres.
   */
  export function point(
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    tool: Pick<IAutoMovieMotionHumanStrikingHeld.ITool, "axis" | "edge">,
    offset: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(
      frame.rotation,
      tool.axis,
    );
    const edge: IAutoMovieVector3 = Quaternion.rotateVector(
      frame.rotation,
      tool.edge,
    );
    return Vector3.add(
      frame.point,
      Vector3.add(
        Vector3.add(
          Vector3.scale(axis, offset.x),
          Vector3.scale(edge, offset.y),
        ),
        Vector3.scale(Vector3.cross(axis, edge), offset.z),
      ),
    );
  }

  /**
   * The supporting hand on the tool at a frame of the holding hand.
   *
   * @param body The body.
   * @param posture The body beneath the hands.
   * @param tool The held tool.
   * @param frame Its holding hand's grip frame, world.
   * @param support The other handle in the tool's own axis-edge basis.
   * @returns The other arm's goal, with its elbow left to the fit.
   */
  export function goal(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    support: IAutoMovieMotionHumanStrikingBlade.ISupport,
  ): IAutoMovieHumanLimbGoal {
    const other: AutoMovieHumanSide = tool.side === "left" ? "right" : "left";
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(
      frame.rotation,
      tool.axis,
    );
    const edge: IAutoMovieVector3 = Quaternion.rotateVector(
      frame.rotation,
      tool.edge,
    );
    const offset: IAutoMovieVector3 = support.offset;
    const along: boolean = support.handle === "axis";
    return {
      ...AutoMovieMotionHumanArm.goal(body, other, {
        surface: "grip",
        shape: "fist",
        ...StrikingHeld.hand(
          StrikingHeld.bare(body, other),
          0,
          point(frame, tool, offset),

          along ? axis : edge,
          along ? edge : axis,
        ),
        bend: AutoMovieMotionHumanBend.hang(body, posture, other),
      }),
      elbow: "strain",
    };
  }

  /**
   * The body with its supporting hand on that handle, unchanged for one hand.
   *
   * @param body The body.
   * @param posture The body beneath the hands.
   * @param tool The held tool.
   * @param frame The holding hand's grip frame.
   * @param support The support contact, or null for one hand.
   * @returns The posture with the supporting arm's goal.
   */
  export function posture(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    support: IAutoMovieMotionHumanStrikingBlade.ISupport | null,
  ): IAutoMovieMotionHumanPosture {
    const other: AutoMovieHumanSide = tool.side === "left" ? "right" : "left";
    return support === null
      ? posture
      : {
          ...posture,
          limbs: {
            ...posture.limbs,
            [`${other}Arm`]: goal(body, posture, tool, frame, support),
          },
        };
  }
}
