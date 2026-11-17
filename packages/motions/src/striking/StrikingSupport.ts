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
 * The other hand's goal on a tool held in both hands, shared by a stroke,
 * its decisive-pose judgement and the demands an earlier grasp must hold.
 * A support hand being replanned is judged at its new goal, not left as an
 * obstacle at the previous action's handle.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the supporting hand's ownership and the three consumers that must agree.
 * @evidence contracts/development/design.md#principled-representation A hand goal from a rigid tool frame and the authored support offset in the tool's axis-edge basis.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A goal and the posture containing it; the stroke and weapon presentation are the consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither a weapon kind nor an entry pose is substituted for the authored support contact.
 */
export namespace StrikingSupport {
  /**
   * The supporting hand on the tool at a frame of the holding hand.
   *
   * @param body The body.
   * @param posture The body beneath the hands.
   * @param tool The held tool.
   * @param frame Its holding hand's grip frame, world.
   * @param support The other handle in the tool's own axis-edge basis.
   * @returns The other arm's goal, with its elbow left to the fit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two hand frames, the offset basis and the elbow rule.
   * @evidence contracts/development/implementation.md#principled-implementation Expands the support offset in the held tool's rotated orthonormal basis, aligns the bare hand to the handle's axis and edge, and asks the shared arm goal to put its grip there.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The tool axes, the offset, the aligned hand and one arm goal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same goal is used before and during the stroke, including when the support hand changes handles.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant rigid-frame work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses StrikingHeld.bare/hand and AutoMovieMotionHumanArm.goal.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
          Vector3.add(
            frame.point,
            Vector3.add(
              Vector3.add(
                Vector3.scale(axis, offset.x),
                Vector3.scale(edge, offset.y),
              ),
              Vector3.scale(Vector3.cross(axis, edge), offset.z),
            ),
          ),
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the one-hand identity and the arm goal added for two hands.
   * @evidence contracts/development/implementation.md#principled-implementation Adds goal's rigidly carried support contact to the same posture the holding arm is judged on.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A null case and one arm member.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every other limb and body channel.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Calls the shared supporting-hand goal.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
