import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { seated } from "../everyday/internal/seated";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/internal/hipJoints";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { HumanMount } from "./HumanMount";
import type { HumanMountedSeats } from "./HumanMountedSeats";

/** The alternatives of `SolveAttitude`'s site. */
type SolveAttitude = "yaw" | "pitch" | "roll";

/**
 * The out-of-saddle seats of a mounted performance: the two-point seat, the
 * racing crouch and standing in the stirrups, each with both soles' balls on
 * their stirrups and the seat clear of the saddle, solved in the carrier
 * contact's frame (`HumanMountedSeats.IContext`).
 *
 * The two-point seat keeps "the seat clear of the saddle, the weight in the
 * stirrups and the hands forward" (Horse Illustrated, the two-point position);
 * the racing crouch rides short stirrups with the trunk level so the jockey
 * stays level while the horse moves beneath (Pfau et al. 2009, Science
 * 325:289); standing in the stirrups straightens the knees. No source read
 * gives the clearances, the trunk inclinations or the knee flexion, so each is
 * provisional and named in `profile`.
 */
export namespace HumanMountedStirrups {
  /** How an out-of-saddle seat stands over its stirrups. */
  export interface IProfile {
    /**
     * The seat socket above the saddle, thigh lengths; absent where `knee` sets
     * the height.
     */
    clear?: number;

    /**
     * The knee flexion that sets the height, degrees; absent where `clear`
     * does.
     */
    knee?: number;

    /** The pelvis's forward inclination, degrees. */
    pitch: number;

    /** How far the hips stand behind the stirrups, thigh lengths. */
    back: number;

    /**
     * The share of the carrier's rise and fall the pelvis is kept out of, 0
     * carried with the saddle to 1 level in space.
     */
    decouple: number;

    /**
     * How far up the reins toward the bit the hands take them, forearm lengths:
     * the shortened reins of a rider out of the saddle, the hands forward on
     * the neck.
     */
    reins: number;
  }

  /**
   * The least the seat socket clears the saddle by in any out-of-saddle seat,
   * metres (provisional).
   */
  export const CLEAR: number = 0.03;

  /**
   * Whether a seat kind is out of the saddle.
   *
   * @param seat The seat kind.
   * @returns True for the two-point seat, the racing crouch, standing and the
   *   bank's ascent.
   */
  export function free(seat: IAutoMovieMotionHumanMounted.Seat): boolean {
    return (
      seat === "twoPoint" ||
      seat === "crouch" ||
      seat === "standing" ||
      seat === "ascent"
    );
  }

  /**
   * A profile quantity blended over a mounted clock's phase: the previous
   * figure's to the current one's by the transfer's share, 0 for a seated
   * figure or before the first.
   *
   * @param figures The figures.
   * @param index The current figure.
   * @param share How far its transfer has gone.
   * @param pick The quantity read from a profile.
   * @returns The blended quantity.
   */
  export function blend(
    figures: readonly IAutoMovieMotionHumanMounted.IFigure[],
    index: number,
    share: number,
    pick: (profile: IProfile) => number,
  ): number {
    const at = (i: number): number =>
      i < 0 || !free(figures[i]!.seat) ? 0 : pick(profile(figures[i]!.seat));
    return at(index - 1) + (at(index) - at(index - 1)) * share;
  }

  /**
   * The profile of an out-of-saddle seat (all provisional): the two-point
   * seat's socket 0.12 thighs over the saddle with the pelvis inclined 40
   * degrees, the crouch's 0.2 thighs with the pelvis inclined 55 degrees,
   * within the hip's flexion against the thighs' slope to the stirrups, and the
   * hips 0.5 thighs behind the stirrups; the hands take the reins a forearm up
   * toward the bit in the crouch, half a forearm in the two-point seat and 0.3
   * standing, the short reins of a rider out of the saddle, and standing at 20
   * degrees of knee flexion with the pelvis inclined 10; the ascent's light
   * seat half the two-point seat's clearance, 0.06 thighs, with the pelvis
   * inclined 45 degrees over the withers and the reins half a forearm up the
   * neck; the crouch keeps the pelvis fully level, as the jockey's crouch does
   * (Pfau et al. 2009), the two-point seat, standing and the ascent half
   * (provisional).
   *
   * @param seat An out-of-saddle seat kind.
   * @returns Its profile.
   */
  export function profile(seat: IAutoMovieMotionHumanMounted.Seat): IProfile {
    if (seat === "crouch")
      return { clear: 0.2, pitch: 55, back: 0.5, decouple: 1, reins: 1 };
    if (seat === "standing")
      return { knee: 20, pitch: 10, back: 0.05, decouple: 0.5, reins: 0.3 };
    if (seat === "ascent")
      return { clear: 0.06, pitch: 45, back: 0.25, decouple: 0.5, reins: 0.5 };
    return { clear: 0.12, pitch: 40, back: 0.25, decouple: 0.5, reins: 0.5 };
  }

  /**
   * An out-of-saddle seat: both balls of the feet on their stirrups, the hips
   * behind them by the profile's share of the thigh, as high as the profile
   * sets, and the pelvis inclined forward.
   *
   * @param context The seat's context.
   * @param supports The figure's supports: `leftFoot` and `rightFoot`.
   * @param seat The out-of-saddle seat kind.
   * @returns The posture.
   * @throws {HumanRefusal} When a stirrup lies outside its leg's band from the
   *   hip the seat needs, narrowed at both ends by the carrier's slack so the
   *   leg can follow the stirrup's rise and fall under a level pelvis, as when
   *   the stirrups are too long to stand clear of the saddle, or when the seat
   *   socket would not clear the saddle by `CLEAR`.
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
    const attitude: Pick<IAutoMovieMotionHumanPosture, SolveAttitude> = {
      yaw: facing,
      pitch: shape.pitch,
      roll: 0,
    };
    const turn: IAutoMovieQuaternion = humanPostureHeading(attitude);
    const feet: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = {
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
    const rest: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
      body,
      { x: 0, y: 0, z: 0 },
      turn,
      entry.joints.hips,
    );

    // The root stands where the hips' middle lies `back` behind the stirrups, or where the socket's clearance puts it, never less than clears the saddle's rise.
    const middle: IAutoMovieVector3 = Vector3.lerp(rest.left, rest.right, 0.5);
    const lifted: IAutoMovieVector3 | undefined =
      shape.clear === undefined
        ? undefined
        : seated.root(
            body,
            {
              x: 0,
              y: Math.max(shape.clear * m.thigh, CLEAR + slack),
              z: behind.z,
            },
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
    const hips: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
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
    const leg = (side: AutoMovieHumanSide): IAutoMovieHumanLimbGoal => ({
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
