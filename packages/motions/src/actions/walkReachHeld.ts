import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { walkFoot } from "./walkFoot";
import { walkReachStance } from "./walkReachStance";
import { walkReach } from "./walkReach";

/**
 * A stance course's pelvis over its feet (`walkStanceCourse`): the pelvis
 * tilted with the trunk about the hips, and the pelvis and the stances held
 * where a course's reading puts them, the walk's own pelvis (`walkReach`)
 * read with the course's drop, pitches and turns.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and who reads it.
 * @evidence contracts/development/design.md#principled-representation The course's half of the walk's pelvis, apart from the walk's own settling.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two functions, read by the stagger's knots and feet.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `walkReach.pelvis` and its records.
 */
export namespace walkReachHeld {
  /**
   * A pelvis tilted with the trunk about the hips, as
   * `AutoMovieMotionHumanLean.pivot` tilts a posture: the hips bone stays and
   * the hip joints turn about it.
   *
   * @param body The body.
   * @param root The upright root, world metres.
   * @param yaw The heading, degrees.
   * @param joints The upright hip joints under that root, world metres.
   * @param trunk The posture's added pitch and roll, degrees.
   * @returns The pelvis's world rotation and the tilted hip joints.
   */
  export function tilt(
    body: IHumanBody,
    root: IAutoMovieVector3,
    yaw: number,
    joints: Readonly<Record<"left" | "right", IAutoMovieVector3>>,
    trunk: { pitch: number; roll: number },
  ): {
    rotation: IAutoMovieQuaternion;
    hips: Record<"left" | "right", IAutoMovieVector3>;
  } {
    const upright: IAutoMovieQuaternion = resolveHumanPosture.heading({
      yaw,
      pitch: 0,
      roll: 0,
    });
    const rotation: IAutoMovieQuaternion = resolveHumanPosture.heading({
      yaw,
      pitch: trunk.pitch,
      roll: trunk.roll,
    });
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      rotation,
      Quaternion.inverse(upright),
    );
    const centre: IAutoMovieVector3 = Vector3.add(
      root,
      Quaternion.rotateVector(upright, body.rest.get("hips")!),
    );
    const at = (side: "left" | "right"): IAutoMovieVector3 =>
      Vector3.add(
        centre,
        Quaternion.rotateVector(turn, Vector3.subtract(joints[side], centre)),
      );
    return { rotation, hips: { left: at("left"), right: at("right") } };
  }

  /**
   * The pelvis and the stances a stance course chose (`walkStanceCourse`):
   * the pelvis turned toward its stances as `pelvis` turns it, tilted with
   * the trunk (`tilt`) and lowered by the course's drop, and each planted
   * foot turned on the floor and pitched about its ball as the course chose,
   * so nothing is solved per second but the pelvis's turn.
   *
   * @param body The body.
   * @param root The upright root before the drop, world metres.
   * @param planned The unconstrained heading, degrees.
   * @param hips The pelvis joint's clinical angles, degrees.
   * @param feet Each foot as scheduled.
   * @param course The course read at the second: its drop, metres, each foot's pitch and turn and the trunk's tilt, degrees.
   * @returns The pelvis and each stance as held.
   */
  export function held(
    body: IHumanBody,
    root: IAutoMovieVector3,
    planned: number,
    hips: readonly [number, number, number],
    feet: Readonly<Record<"left" | "right", walkFoot.IScheduled>>,
    course: {
      drop: number;
      pitch: Record<"left" | "right", number>;
      turn: Record<"left" | "right", number>;
      trunk: { pitch: number; roll: number };
    },
  ): walkReach.IGround {
    const {
      yaw,
      pivots,
      hips: upright,
    }: walkReach.IPelvis = walkReach.pelvis(body, root, planned, hips, feet);
    const lowered: IAutoMovieVector3 = { ...root, y: root.y - course.drop };
    const tilted = tilt(
      body,
      lowered,
      yaw,
      {
        left: { ...upright.left, y: upright.left.y - course.drop },
        right: { ...upright.right, y: upright.right.y - course.drop },
      },
      course.trunk,
    );
    const placed = {} as Record<"left" | "right", walkFoot.IEnd>;
    const contacts = {} as Record<"left" | "right", IAutoMovieVector3>;
    for (const side of walkReach.SIDES) {
      // A swinging foot is the swing's to place; it stands as scheduled.
      if (feet[side].swing !== undefined) {
        placed[side] = { ...feet[side].placement, toes: feet[side].toes };
        contacts[side] = HumanFoot.offset(body, side, "mtp");
        continue;
      }
      const out: { end: walkFoot.IEnd; contact: IAutoMovieVector3 } =
        walkReachStance.of(
          body,
          side,
          {
            ...feet[side],
            placement: HumanFoot.turned(
              feet[side].placement,
              course.turn[side],
            ),
          },
          tilted.hips[side],
          yaw,
          pivots[side],
          0,
          course.pitch[side],
        );
      placed[side] = out.end;
      contacts[side] = out.contact;
    }
    return {
      yaw,
      root: lowered,
      hips: tilted.hips,
      feet: placed,
      contacts,
      pelvis: tilted.rotation,
    };
  }
}
