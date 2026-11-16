import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Tilt, its fixed-heading preparation and held-course reading serve stagger's knots and feet.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed hips pivot, world-metre geometry and added trunk angles.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original rigid turn from upright heading to trunk heading about the body's hips bone; preparation owns the same quaternion order and pivot calculation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates one requested tilt to prepareTilt's shared fixed-heading calculation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the same heading convention, body rest hip and both joint offsets without a changed angle or position.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and two-joint rigid transformation; repeated fixed-heading callers can prepare once explicitly.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the same tilt producer as the derivative-loop consumer, with no global cache or cross-call pose memo.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The temporary reader releases after this call and the result belongs to its caller.
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
    return prepareTilt(body, yaw)(root, joints, trunk);
  }

  /**
   * Prepare a pelvis tilt whose body and upright heading remain fixed.
   *
   * @param body The body with unchanged rest hips for this operation.
   * @param yaw The fixed upright heading, degrees.
   * @returns A reader of the varying root, upright world hip joints and trunk tilt.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed body/heading premises, varying world geometry, degrees and operation lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Precomputes only the original upright heading inverse and rotated rest-hip offset; each reading preserves rotation*inverse(upright), root+offset and both rotated hip differences in their original order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed heading data precedes one two-hip reader of the existing rigid-pivot law.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tilt is approximated or cached, and varying root/joint inputs retain their original arithmetic and units.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and constant per-read work; upright inverse, rest-map lookup and rest-offset rotation occur once for the owning knot rather than for each derivative probe.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A caller may share the reader only while body rest geometry and upright yaw remain fixed; each different trunk/root/joint input is evaluated directly with fresh output records.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One caller-owned reader retains a quaternion inverse, rest offset and heading until its problem is released, without query-dependent storage or handles.
   */
  export function prepareTilt(
    body: IHumanBody,
    yaw: number,
  ): (
    root: IAutoMovieVector3,
    joints: Readonly<Record<"left" | "right", IAutoMovieVector3>>,
    trunk: { pitch: number; roll: number },
  ) => ReturnType<typeof tilt> {
    const upright: IAutoMovieQuaternion = resolveHumanPosture.heading({
      yaw,
      pitch: 0,
      roll: 0,
    });
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(upright);
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(upright, body.rest.get("hips")!);
    return (
      root: IAutoMovieVector3,
      joints: Readonly<Record<"left" | "right", IAutoMovieVector3>>,
      trunk: { pitch: number; roll: number },
    ): ReturnType<typeof tilt> => {
      const rotation: IAutoMovieQuaternion = resolveHumanPosture.heading({
        yaw,
        pitch: trunk.pitch,
        roll: trunk.roll,
      });
      const turn: IAutoMovieQuaternion = Quaternion.multiply(
        rotation,
        inverse,
      );
      const centre: IAutoMovieVector3 = Vector3.add(
        root,
        offset,
      );
      const at: (side: "left" | "right") => IAutoMovieVector3 = (side: "left" | "right"): IAutoMovieVector3 =>
        Vector3.add(
          centre,
          Quaternion.rotateVector(turn, Vector3.subtract(joints[side], centre)),
        );
      return { rotation, hips: { left: at("left"), right: at("right") } };
    };
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
   * @param resolution Optional exact FK source borrowed only by this synchronous pelvis placement.
   * @returns The pelvis and each stance as held.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world root/foot inputs, clinical hips, course drop/angles and the held result.
   * @evidence contracts/development/implementation.md#principled-implementation Keeps walkReach's stance-directed pelvis, lowers it by the authored course drop, tilts about the hips and holds each planted rocker with the original pitch/turn while swing feet retain their schedule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pelvis reading and tilt precede a two-foot loop delegated to the existing stance-rocker owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the course's actual drop, pitches, turns and trunk without refitting the trajectory or changing a contact.
   * @evidence contracts/development/implementation.md#efficient-algorithms One existing pelvis solve and at most two stance readers per query, with no full-body fit or time-keyed result cache in this helper.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses canonical pelvis and rocker owners; the supplied course is the same synchronous sample consumed by the trunk writer. An optional parent FK source reaches pelvis's actual hip reading, sharing only dependency-checked transform prerequisites.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh ground records and retains neither the optional FK source nor any query state after synchronous return or throw.
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
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): walkReach.IGround {
    const {
      yaw,
      pivots,
      hips: upright,
    }: walkReach.IPelvis = walkReach.pelvis(
      body, root, planned, hips, feet,
      typeof resolution === "function" ? resolution() : resolution,
    );
    const lowered: IAutoMovieVector3 = { ...root, y: root.y - course.drop };
    const tilted: ReturnType<typeof tilt> = tilt(
      body,
      lowered,
      yaw,
      {
        left: { ...upright.left, y: upright.left.y - course.drop },
        right: { ...upright.right, y: upright.right.y - course.drop },
      },
      course.trunk,
    );
    const place: (side: "left" | "right") => { end: walkFoot.IEnd; contact: IAutoMovieVector3 } = (
      side: "left" | "right",
    ): { end: walkFoot.IEnd; contact: IAutoMovieVector3 } => {
      // A swinging foot is the swing's to place; it stands as scheduled.
      if (feet[side].swing !== undefined) {
        return {
          end: { ...feet[side].placement, toes: feet[side].toes },
          contact: HumanFoot.offset(body, side, "mtp"),
        };
      }
      return walkReachStance.of(
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
    };
    const left: ReturnType<typeof place> = place("left");
    const right: ReturnType<typeof place> = place("right");
    return {
      yaw,
      root: lowered,
      hips: tilted.hips,
      feet: { left: left.end, right: right.end },
      contacts: { left: left.contact, right: right.contact },
      pelvis: tilted.rotation,
    };
  }
}
