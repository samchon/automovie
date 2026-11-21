import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { seated } from "../everyday/seated";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanMount } from "./HumanMount";
import type { HumanMountedSeats } from "./HumanMountedSeats";

/**
 * The out-of-saddle seats of a mounted performance: the two-point seat, the
 * racing crouch and standing in the stirrups, each with both soles' balls on
 * their stirrups and the seat clear of the saddle, solved in the carrier
 * contact's frame (`HumanMountedSeats.IContext`).
 *
 * The two-point seat keeps "the seat clear of the saddle, the weight in the
 * stirrups and the hands forward" (Horse Illustrated, the two-point
 * position); the racing crouch rides short stirrups with the trunk level so
 * the jockey stays level while the horse moves beneath (Pfau et al. 2009,
 * Science 325:289); standing in the stirrups straightens the knees. No
 * source read gives the clearances, the trunk inclinations or the knee
 * flexion, so each is provisional and named in `profile`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three seats, their sources and which values are provisional.
 * @evidence contracts/development/design.md#principled-representation Each seat is a posture in the carrier contact's frame, its profile a named record of three quantities.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The solver, the profile and the out-of-saddle test `HumanMounted` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No carrier is named; the stirrups are the figure's supports.
 */
export namespace HumanMountedStirrups {
  /**
   * How an out-of-saddle seat stands over its stirrups.
   *
   * @evidence contracts/development/common.md#meaningful-documentation clear: The seat socket above the saddle, thigh lengths, or none where the knee flexion sets the height. knee: The knee flexion that sets the height, degrees. pitch: The pelvis's forward inclination, degrees. back: How far the hips stand behind the stirrups, thigh lengths.
   * @evidence contracts/development/design.md#principled-representation Shares of the thigh and degrees, so one profile fits every body.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `solve`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Exactly one of `clear` and `knee` sets the height.
   */
  export interface IProfile {
    /** The seat socket above the saddle, thigh lengths; absent where `knee` sets the height. */
    clear?: number;

    /** The knee flexion that sets the height, degrees; absent where `clear` does. */
    knee?: number;

    /** The pelvis's forward inclination, degrees. */
    pitch: number;

    /** How far the hips stand behind the stirrups, thigh lengths. */
    back: number;

    /** The share of the carrier's rise and fall the pelvis is kept out of, 0 carried with the saddle to 1 level in space. */
    decouple: number;
  }

  /** The least the seat socket clears the saddle by in any out-of-saddle seat, metres (provisional). */
  export const CLEAR: number = 0.03;

  /**
   * Whether a seat kind is out of the saddle.
   *
   * @param seat The seat kind.
   * @returns True for the two-point seat, the racing crouch and standing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which kinds.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A membership test.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function free(seat: IAutoMovieMotionHumanMounted.Seat): boolean {
    return seat === "twoPoint" || seat === "crouch" || seat === "standing";
  }

  /**
   * The profile of an out-of-saddle seat (all provisional): the two-point seat's socket 0.12 thighs over the saddle with the pelvis inclined 40 degrees, the crouch's 0.2 thighs with the pelvis inclined 75 degrees so the trunk lies level with the spine's own flexion, and standing at 20 degrees of knee flexion with the pelvis inclined 10; the crouch keeps the pelvis fully level, as the jockey's crouch does (Pfau et al. 2009), the two-point seat and standing half (provisional).
   *
   * @param seat An out-of-saddle seat kind.
   * @returns Its profile.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each profile and that it is provisional.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A table read.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One choice per kind.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The values are provisional and named, not fitted to a case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function profile(seat: IAutoMovieMotionHumanMounted.Seat): IProfile {
    if (seat === "crouch")
      return { clear: 0.2, pitch: 75, back: 0.35, decouple: 1 };
    if (seat === "standing")
      return { knee: 20, pitch: 10, back: 0.05, decouple: 0.5 };
    return { clear: 0.12, pitch: 40, back: 0.25, decouple: 0.5 };
  }

  /**
   * An out-of-saddle seat: both balls of the feet on their stirrups, the hips behind them by the profile's share of the thigh, as high as the profile sets, and the pelvis inclined forward.
   *
   * @param context The seat's context.
   * @param supports The figure's supports: `leftFoot` and `rightFoot`.
   * @param seat The out-of-saddle seat kind.
   * @returns The posture.
   * @throws {HumanRefusal} When a stirrup lies outside its leg's band from the hip the seat needs, narrowed at both ends by the carrier's slack so the leg can follow the stirrup's rise and fall under a level pelvis, as when the stirrups are too long to stand clear of the saddle, or when the seat socket would not clear the saddle by `CLEAR`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the posture and both refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Each ball is placed on its tread (`HumanFoot.pivot`); the hip height follows from the socket's clearance through `seated.root`, or, standing, from the hip-to-ankle distance of the knee's flexion by the law of cosines on the thigh and the shank, and is capped where a leg would stretch past the sitting band (`HumanMount.span`) less the carrier's slack; each leg is then checked against that band and the socket against `CLEAR`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The feet, the root, the checks, the legs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A stirrup out of reach is refused with the band, never clamped to.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Solved once per figure.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function solve(
    context: HumanMountedSeats.IContext,
    supports: IAutoMovieMotionHumanMounted.ISupports,
    seat: IAutoMovieMotionHumanMounted.Seat,
  ): IAutoMovieMotionHumanPosture {
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const shape: IProfile = profile(seat);
    const slack: number = context.slack * shape.decouple;
    const facing: number = 360 * Math.round(entry.yaw / 360);
    const attitude: Pick<
      IAutoMovieMotionHumanPosture,
      "yaw" | "pitch" | "roll"
    > = { yaw: facing, pitch: shape.pitch, roll: 0 };
    const turn: IAutoMovieQuaternion = resolveHumanPosture.heading(attitude);
    const feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> =
      {
        left: HumanFoot.pivot(
          body,
          "left",
          "ball",
          context.point(supports.leftFoot!),
          facing,
          0,
        ),
        right: HumanFoot.pivot(
          body,
          "right",
          "ball",
          context.point(supports.rightFoot!),
          facing,
          0,
        ),
      };
    const ankles: IAutoMovieVector3 = Vector3.lerp(
      feet.left.ankle,
      feet.right.ankle,
      0.5,
    );
    const behind: IAutoMovieVector3 = HumanFrame.point(
      { origin: ankles, yaw: facing },
      { x: 0, y: 0, z: -shape.back * m.thigh },
    );

    // The height: the socket's clearance, or the hips where the knee's flexion leaves them over the ankles, and never higher than a leg can hold its stirrup through the carrier's rise and fall.
    const [near, far]: readonly [number, number] = HumanMount.span(body);
    const rest: Record<"left" | "right", IAutoMovieVector3> = hipJoints(
      body,
      { x: 0, y: 0, z: 0 },
      turn,
      entry.joints.hips,
    );

    // The root stands where the hips' middle lies `back` behind the stirrups, or where the socket's clearance puts it.
    const middle: IAutoMovieVector3 = Vector3.lerp(rest.left, rest.right, 0.5);
    const lifted: IAutoMovieVector3 | undefined =
      shape.clear === undefined
        ? undefined
        : seated.root(
            body,
            { x: 0, y: shape.clear * m.thigh, z: behind.z },
            attitude,
          );
    const anchor: IAutoMovieVector3 = lifted ?? {
      x: -middle.x,
      y: 0,
      z: behind.z - middle.z,
    };
    let top: number = Infinity;
    const r: number = ((shape.knee ?? 0) * Math.PI) / 180;
    const reach: number =
      (shape.knee === undefined
        ? far
        : Math.sqrt(
            m.thigh * m.thigh +
              m.shank * m.shank +
              2 * m.thigh * m.shank * Math.cos(r),
          )) - slack;
    for (const side of ["left", "right"] as const) {
      const across: number = Math.hypot(
        anchor.x + rest[side].x - feet[side].ankle.x,
        anchor.z + rest[side].z - feet[side].ankle.z,
      );
      top = Math.min(
        top,
        feet[side].ankle.y +
          Math.sqrt(Math.max(0, reach * reach - across * across)) -
          rest[side].y,
      );
    }
    const root: IAutoMovieVector3 = {
      ...anchor,
      y: lifted === undefined ? top : Math.min(lifted.y, top),
    };
    const hips: Record<"left" | "right", IAutoMovieVector3> = hipJoints(
      body,
      root,
      turn,
      entry.joints.hips,
    );
    for (const side of ["left", "right"] as const) {
      const length: number = Vector3.distance(hips[side], feet[side].ankle);
      if (!(length >= near + slack && length <= far - slack + 1e-9))
        throw new HumanRefusal({
          kind: "reach",
          axis: `supports.${side}Foot`,
          value: length,
          feasible: {
            kind: "range",
            minimum: near + slack,
            maximum: far - slack,
            unit: "m",
          },
          reason: `the ${seat} seat puts the ${side} stirrup ${length.toFixed(3)} m from its hip, outside the leg's band: the stirrups are ${length > far - slack ? "too long to stand clear of the saddle" : "too short"}`,
          fix: "set the stirrups within the leg's reach for this seat, or ride seated",
        });
    }
    const posture: IAutoMovieMotionHumanPosture = {
      ...entry,
      ...attitude,
      root,
    };
    const socket: number = seated.socket(body, posture).y;
    if (!(socket >= CLEAR + slack))
      throw new HumanRefusal({
        kind: "reach",
        axis: `figures.${seat}`,
        value: socket,
        feasible: {
          kind: "range",
          minimum: CLEAR + slack,
          maximum: null,
          unit: "m",
        },
        reason: `the ${seat} seat leaves the seat socket ${socket.toFixed(3)} m over the saddle, not clear of it, the legs holding their stirrups ${feet.left.ankle.y.toFixed(3)} m below it through the carrier's rise and fall of ${slack.toFixed(3)} m`,
        fix: "shorten the stirrups, or ride seated",
      });
    const leg = (side: "left" | "right"): IAutoMovieHumanLimbGoal => ({
      point: feet[side].ankle,
      rotation: feet[side].rotation,
      bend: Vector3.add(
        hips[side],
        Vector3.scale(HumanFrame.forward(facing), m.thigh),
      ),
      planted: true,
      contact: HumanFoot.offset(body, side, "ball"),
    });
    return {
      ...posture,
      limbs: { leftLeg: leg("left"), rightLeg: leg("right") },
    };
  }
}
