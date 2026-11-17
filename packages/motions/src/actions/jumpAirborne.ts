import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanJumpAirborne, IAutoMovieMotionHumanPosture, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion, minimumJerk } from "@automovie/engine";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { jumpPath } from "./jumpPath";
import { stand } from "./stand";

/**
 * A jump's time in the air: the shape it holds between take-off and
 * touchdown, the knee hint its legs bend toward, and the turns it asks the
 * performance's flight pass for (#3428), with the hook that hands the
 * rotation back (`IHumanActionPlan.airborne`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three parts of the flight it owns and who turns it.
 * @evidence contracts/development/design.md#principled-representation The flight's shape, its knee hint and its turns, apart from the push-off and the landing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The requested turns, the shape's inputs and three builders, read by the jump.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The turning is the flight pass's; this module only declares it and carries what comes back.
 */
export namespace jumpAirborne {

  /**
   * What the airborne shape is drawn from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The jump's own heading, joints and the feet's body-frame places at take-off and touchdown.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values `posture` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every length is the body's.
   */
  export interface IShape {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The foot that pushed off. */
    takeoff: "left" | "right";

    /** The upright trunk's joints. */
    joints: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    >;

    /** Each foot's body-frame place at take-off, metres. */
    start: Record<"left" | "right", IAutoMovieVector3>;

    /** Each foot's body-frame place at touchdown, metres. */
    end: Record<"left" | "right", IAutoMovieVector3>;

    /** The jump's heading, degrees about +Y. */
    heading: number;
  }

  /**
   * The point a leg's knee bends toward: ahead of the knee's rest place on
   * the body turned to the heading, at a yaw.
   *
   * @param body The body.
   * @param heading The jump's heading, degrees.
   * @param root The root, world metres.
   * @param side The leg.
   * @param yaw The direction the knee points, degrees.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the point.
   * @evidence contracts/development/implementation.md#principled-implementation A pole one metre ahead of the knee's rest place, the hint a two-bone fit bends toward.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two frame points.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function knee(
    body: IAutoMovieMotionHumanBody,
    heading: number,
    root: IAutoMovieVector3,
    side: "left" | "right",
    yaw: number,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      {
        origin: HumanFrame.point(
          { origin: root, yaw: heading },
          body.rest.get(`${side}LowerLeg`)!,
        ),
        yaw,
      },
      { x: 0, y: 0, z: 1 },
    );
  }

  /**
   * The airborne posture at a root and a share of the flight: the arms
   * lowering from the push's height, the take-off toes uncurling, and each
   * foot carried on a minimum-jerk path from its take-off place to its
   * touchdown place in the body's frame, lifted by a tenth of the hip
   * height at mid-flight.
   *
   * @param shape What the shape is drawn from.
   * @param root The root, world metres.
   * @param u The share of the flight, in [0, 1].
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each part of the shape does over the flight.
   * @evidence contracts/development/implementation.md#principled-implementation Minimum-jerk interpolation of the feet's body-frame places (Flash and Hogan 1985, as the motion skill cites), with the jump's own arm and toe angles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One joint table and one goal per leg.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The angles are the jump's own provisional ones, moved here unchanged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function posture(
    shape: IShape,
    root: IAutoMovieVector3,
    u: number,
  ): IAutoMovieMotionHumanPosture {
    const { body, takeoff, heading } = shape;
    const l: number = body.measure.hipHeight;
    const s: number = minimumJerk(u).s;
    const arms: number = 60 - 30 * s;
    const joints: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {
      ...stand.relaxed(body),
      ...shape.joints,
      leftUpperArm: [arms, stand.abduction(body), 0],
      rightUpperArm: [arms, stand.abduction(body), 0],
      leftLowerArm: [12 + arms / 3, 0, 0],
      rightLowerArm: [12 + arms / 3, 0, 0],
      [`${takeoff}Toes`]: [40 * (1 - s), 0, 0],
    };
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const side of ["left", "right"] as const) {
      const p: IAutoMovieVector3 = jumpPath.lerp(
        shape.start[side],
        shape.end[side],
        s,
      );
      const point: IAutoMovieVector3 = HumanFrame.point(
        { origin: root, yaw: heading },
        { ...p, y: p.y + 0.1 * l * Math.sin(Math.PI * u) },
      );
      const pitch: number = side === takeoff ? -40 * (1 - s) : 0;
      limbs[`${side}Leg`] = {
        point,
        rotation: HumanFoot.rotation(
          heading + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT) * s,
          pitch,
        ),
        bend: knee(body, heading, root, side, heading),
      };
    }
    return { root, yaw: heading, pitch: 0, roll: 0, joints, limbs };
  }

  /**
   * A flight's declared turns and the rotation the flight pass hands back.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it carries.
   * @evidence contracts/development/design.md#principled-representation The plan's flight members and the turn applied to a posture in flight.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two plan members the jump spreads and the turn its posture reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The members are the plan's own (`IHumanActionPlan.flight`, `airborne`).
   */
  export interface ITurning {
    /** The plan's flight members, none for a flight with no turns. */
    declared: Pick<IAutoMovieMotionHumanActionPlan, "flight" | "airborne">;

    /**
     * A posture in flight with the rotation handed back, unchanged before
     * it arrives and outside the flight.
     *
     * @param posture The posture.
     * @param seconds Seconds of the jump.
     * @returns The posture, turned.
     */
    turned(posture: IAutoMovieMotionHumanPosture, seconds: number): IAutoMovieMotionHumanPosture;
  }

  /**
   * A flight's turns as plan members: the somersault signed by its way, a
   * side salto's somersault frame turned a quarter about the long axis,
   * and the rotation kept once the pass hands it back.
   *
   * @param rotation The requested turns, none when absent.
   * @param takeoff Seconds of the jump at take-off.
   * @param touchdown Seconds of the jump at touchdown.
   * @param duration The jump's duration, seconds.
   * @returns The turning.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the signs, the side salto's frame and when the rotation applies.
   * @evidence contracts/development/implementation.md#principled-implementation Turns become the plan's flight request; the flight pass solves the momentum and hands the rotation back once.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One request and one held rotation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No turn is scripted here.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs but for the held rotation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the one rotation the pass hands back, for as long as the plan.
   */
  export function turning(
    rotation: IAutoMovieMotionHumanJumpAirborne.IRotation | undefined,
    takeoff: number,
    touchdown: number,
    duration: number,
  ): ITurning {
    const somersault: number =
      (rotation?.somersault ?? 0) * (rotation?.way === "backward" ? -1 : 1);
    const twist: number = rotation?.twist ?? 0;
    const sideways: boolean =
      rotation?.way === "left" || rotation?.way === "right";
    let rotated: ((seconds: number) => IAutoMovieMotionHumanPosture.IRotation) | null = null;
    const declared: Pick<IAutoMovieMotionHumanActionPlan, "flight" | "airborne"> =
      somersault === 0 && twist === 0
        ? {}
        : {
            flight: {
              from: takeoff / duration,
              to: touchdown / duration,
              momentum: {
                kind: "turns",
                somersault,
                twist,
                ...(sideways
                  ? {
                      frame: Quaternion.fromAxisAngle(
                        { x: 0, y: 1, z: 0 },
                        rotation?.way === "left" ? 90 : -90,
                      ),
                    }
                  : {}),
              },
            },
            airborne: (
              handed: (seconds: number) => IAutoMovieMotionHumanPosture.IRotation,
            ): void => {
              rotated = handed;
            },
          };
    return {
      declared,
      turned: (posture: IAutoMovieMotionHumanPosture, t: number): IAutoMovieMotionHumanPosture =>
        rotated === null || t <= takeoff || t >= touchdown
          ? posture
          : { ...posture, rotation: rotated(t) },
    };
  }
}
