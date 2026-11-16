import { Quaternion, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { tags } from "typia";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanUnit } from "../law/HumanUnit";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { jumpPath } from "./jumpPath";
import type { jumpState } from "./jumpState";

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
   * A flight's requested turns.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit, sign and default.
   * @evidence contracts/development/design.md#principled-representation Turns about the somersault and long axes and the way, as the author writes them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all read by `turning`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The way is a closed union.
   */
  export interface IRotation {
    /** Somersault turns, whole or half; 0 when absent. */
    somersault?: number & tags.Minimum<0> & HumanUnit<"">;

    /** Twist turns, signed; 0 when absent. */
    twist?: number & HumanUnit<"">;

    /** Which way the somersault turns; `forward` when absent. */
    way?: "forward" | "backward" | "left" | "right";
  }

  /**
   * What the airborne shape is drawn from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The jump's own heading, unchanged body dimensions and achieved canonical endpoint states define its free-flight shape.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the prepared posture reader consumes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every length is the body's.
   */
  export interface IShape {
    /** The body whose hip height scales the existing free-foot arch. */
    body: IHumanBody;

    /** The foot that pushed off. */
    takeoff: "left" | "right";

    /** The actual achieved push endpoint; its leg geometry is in the root frame. */
    start: jumpState.IState;

    /** The actual achieved touchdown endpoint in the same frame. */
    end: jumpState.IState;

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
    body: IHumanBody,
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
   * foot carried on a minimum-jerk path between achieved endpoint states,
   * lifted by a tenth of hip height at mid-flight along the existing sine
   * arch. Endpoint values are shared; world COM and angular C1 are not
   * established by this shape interpolation.
   *
   * @param shape Fixed achieved endpoints, body dimensions and flight heading.
   * @returns A posture reader of a world-metre root and flight share in [0,1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each part of the shape does over the flight.
   * @evidence contracts/development/implementation.md#principled-implementation Minimum-jerk endpoint interpolation (Flash and Hogan 1985) uses achieved foot/knee/toe values and quaternion interpolation of achieved foot rotations. The existing provisional arch remains 0.1 hip heights times sin(pi*u); no extra path projection or rate law is added.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare fixed joint start/difference tracks and the heading turn once; each read copies the achieved seed, interpolates arms/toes and builds two free goals from the same endpoints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fixed -40-degree seed, reconstructed ankle, ground plant, epsilon or boundary-only pose replaces the achieved shape. Coupled ROM remains the ordinary resolver's responsibility.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed joint tracks and the heading quaternion prepare once per plan. Each read shares one minimum-jerk share, one sine arch and one frame between both legs, then performs the original fixed-size interpolation and fresh joint-record copy; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only unchanged endpoint tuples and heading are prepared; every requested root/share evaluates its original goals and returns fresh changed tuples, vectors and goal records without a time-keyed cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns its endpoint records, fixed-size joint tracks and one heading quaternion; no query history or external handle accumulates. Each returned posture owns its new records while unchanged clinical tuples retain the existing readonly endpoint ownership.
   */
  export function prepare(
    shape: IShape,
  ): (root: IAutoMovieVector3, u: number) => IHumanPosture {
    const { body, takeoff, heading }: IShape = shape;
    const tracks: IJointTrack[] = [];
    for (const bone of [
      "leftUpperArm", "rightUpperArm", "leftLowerArm", "rightLowerArm",
      "leftUpperLeg", "rightUpperLeg", "leftLowerLeg", "rightLowerLeg", "leftFoot", "rightFoot",
    ] as const) {
      const from: readonly [number, number, number] = shape.start.joints[bone] ?? [0, 0, 0];
      const into: readonly [number, number, number] = shape.end.joints[bone] ?? [0, 0, 0];
      tracks.push({ bone, from, delta: [into[0] - from[0], into[1] - from[1], into[2] - from[2]] });
    }
    const toe: AutoMovieHumanoidBone = `${takeoff}Toes`;
    const fromToe: number = shape.start.joints[toe]?.[0] ?? 0;
    const intoToe: number = shape.end.joints[toe]?.[0] ?? 0;
    const turn: ReturnType<typeof HumanFrame.turn> = HumanFrame.turn(heading);
    return (root: IAutoMovieVector3, u: number): IHumanPosture => {
      const s: number = minimumJerk(u).s;
      const joints: IHumanPosture["joints"] = { ...shape.start.joints };
      for (const track of tracks)
        joints[track.bone] = [
          track.from[0] + track.delta[0] * s,
          track.from[1] + track.delta[1] * s,
          track.from[2] + track.delta[2] * s,
        ];
      joints[toe] = [fromToe + (intoToe - fromToe) * s, 0, 0];
      const limbs: IHumanPosture["limbs"] = {};
      const frame: HumanFrame.IFrame = { origin: root, yaw: heading };
      const arch: number = 0.1 * body.measure.hipHeight * Math.sin(Math.PI * u);
      for (const side of ["left", "right"] as const) {
        const p: IAutoMovieVector3 = jumpPath.lerp(
          shape.start.legs[side].point,
          shape.end.legs[side].point,
          s,
        );
        const point: IAutoMovieVector3 = HumanFrame.point(frame, { ...p, y: p.y + arch });
        const rotation: ReturnType<typeof Quaternion.slerp> = Quaternion.slerp(
          shape.start.legs[side].rotation, shape.end.legs[side].rotation, s,
        );
        limbs[`${side}Leg`] = {
          point,
          rotation: Quaternion.multiply(turn, rotation),
          bend: HumanFrame.point(frame,
            jumpPath.lerp(shape.start.legs[side].bend, shape.end.legs[side].bend, s),
          ),
        };
      }
      return { root, yaw: heading, pitch: 0, roll: 0, joints, limbs };
    };
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
    declared: Pick<IHumanActionPlan, "flight" | "airborne">;

    /**
     * A posture in flight with the rotation handed back, unchanged before
     * it arrives and outside the flight.
     *
     * @param posture The posture.
     * @param seconds Seconds of the jump.
     * @returns The posture, turned.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the local jump clock and that the received whole-body turn is absent before handback and outside the flight.
     * @evidence contracts/development/implementation.md#principled-implementation The actual turning producer returns the posture with the flight pass's rigid rotation about COM strictly inside its declared span.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One handed-back-reader/span check, otherwise one fresh posture record with rotation.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not script a turn, alter momentum or mark a free limb as a world plant.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed-size optional record update.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses exactly the rotation supplied by the real performance flight pass.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds its existing handed-back reader; each call preserves unchanged posture identity or returns one new record with no added global state.
     */
    turned(posture: IHumanPosture, seconds: number): IHumanPosture;
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
    rotation: IRotation | undefined,
    takeoff: number,
    touchdown: number,
    duration: number,
  ): ITurning {
    const somersault: number =
      (rotation?.somersault ?? 0) * (rotation?.way === "backward" ? -1 : 1);
    const twist: number = rotation?.twist ?? 0;
    const sideways: boolean =
      rotation?.way === "left" || rotation?.way === "right";
    let rotated: ((seconds: number) => IHumanPosture.IRotation) | null = null;
    const declared: Pick<IHumanActionPlan, "flight" | "airborne"> =
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
              handed: (seconds: number) => IHumanPosture.IRotation,
            ): void => {
              rotated = handed;
            },
          };
    return {
      declared,
      turned: (posture: IHumanPosture, t: number): IHumanPosture =>
        rotated === null || t <= takeoff || t >= touchdown
          ? posture
          : { ...posture, rotation: rotated(t) },
    };
  }
}

/** One fixed endpoint joint and its clinical difference, prepared once per flight. */
interface IJointTrack {
  /** The joint being interpolated. */
  bone: AutoMovieHumanoidBone;

  /** Clinical degrees at takeoff. */
  from: readonly [number, number, number];

  /** Touchdown minus takeoff, clinical degrees. */
  delta: readonly [number, number, number];
}
