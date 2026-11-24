import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** The alternatives of `INCLINESEntryItem`'s site. */
type INCLINESEntryItem = "hip" | "midway" | "shoulder";

/**
 * The stance a sled push (`pushSled`) takes its handles from: how far the trunk
 * inclines into the load and how far the body sinks onto bent knees.
 *
 * The incline is the measured one for the handles' height. Lim, Case and
 * D'Souza (2016, Proc HFES 60:970; 12 men, two-handed isometric pushes)
 * measured the torso's flexion from upright standing at three handle heights,
 * each the subject's own: 45.0 (SD 14.3) degrees at the hip, 26.9 (6.7) midway
 * and 18.7 (8.4) at the shoulder at their highest force, the one a sled push
 * takes (`INCLINES`). A handle between two of them takes the incline between
 * theirs in proportion; a handle below the hip continues the hip-to-midway
 * slope, up to `RANGE`; above the shoulder keeps the shoulder's; and never less
 * than the push's own `lean`. An incline asked outright (a haul at a declared
 * load, `pushPullLean`) replaces all of it.
 *
 * The body then sinks onto bent knees as far as brings each wrist within the
 * arm's reach from its shoulder at the highest the walk raises it (`rise`), so
 * the hands keep their handles through the gait's rise and fall.
 */
export namespace pushSledStance {
  /**
   * The torso's flexion from upright standing at the subject's hip, midway and
   * shoulder handle heights, degrees, at the highest push force (Lim, Case and
   * D'Souza 2016, motion capture means). The study gives the midway handle no
   * height; it is read as halfway between the hip and the shoulder.
   */
  export const INCLINES: Readonly<Record<INCLINESEntryItem, number>> = {
    hip: 45.0,
    midway: 26.9,
    shoulder: 18.7,
  };

  /**
   * The steepest incline a push takes, degrees: the hip-height mean and two of
   * its standard deviations, 45.0 + 2 x 14.3 (Lim, Case and D'Souza 2016),
   * which leaves out the steepest fortieth of pushers.
   */
  export const RANGE: number = 45.0 + 2 * 14.3;

  /** The rate the walk's rise is read at, per second: the display's 30 frames. */
  export const RATE: number = 30;

  /**
   * The trunk's incline from the vertical, degrees, and the body's sink onto
   * bent knees, metres.
   */
  export interface IStance {
    /** Degrees from the vertical, from the push's lean to `RANGE`. */
    incline: number;

    /** Metres, not negative. */
    sink: number;
  }

  /**
   * Solve the stance.
   *
   * @param body The body.
   * @param walk The walk the push is written over.
   * @param settle The second of the walk the handles are taken at.
   * @param feet Each foot at the entry, whose lower sole is the floor.
   * @param handles Each hand's handle frame.
   * @param lean The least incline, degrees from the vertical.
   * @param incline The incline asked outright, degrees from the vertical,
   *   negative leaning back, which replaces the measured one and `lean` (a haul
   *   at a declared load, `pushPullLean`); the measured one when absent.
   * @returns The stance.
   */
  export function solved(
    body: IAutoMovieMotionHumanBody,
    walk: IAutoMovieMotionHumanActionPlan,
    settle: number,
    feet: IAutoMovieMotionHumanEntryState["feet"],
    handles: Record<AutoMovieHumanSide, IAutoMovieMotionHumanHand.IFrame>,
    lean: number,
    incline?: number,
  ): IStance {
    const standing: IAutoMovieMotionHumanPosture = walk.posture(settle);

    // The floor under the entry's lower sole, and how far the walk raises
    // the body above where it takes the handles, read at the display rate.
    const floor: number = pushSledStance.floor(body, feet);
    let rise: number = 0;
    for (let t: number = settle; t <= walk.duration; t += 1 / RATE)
      rise = Math.max(
        rise,
        walk.posture(t, ROOT_CHANNELS).root.y - standing.root.y,
      );
    const asked: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: HumanHand.reach(body, "left", "grip", handles.left, "fist").point,
      right: HumanHand.reach(body, "right", "grip", handles.right, "fist")
        .point,
    };

    // The measured incline at the handles' height.
    const height: number =
      (handles.left.point.y + handles.right.point.y) / 2 - floor;
    const hip: number = body.measure.hipHeight;
    const shoulder: number = body.measure.shoulderHeight;
    const midway: number = (hip + shoulder) / 2;
    const between: (a: number, b: number, at: number, to: number) => number = (
      a: number,
      b: number,
      at: number,
      to: number,
    ): number => at + ((to - at) * (height - a)) / (b - a);
    const measured: number =
      height >= shoulder
        ? INCLINES.shoulder
        : height >= midway
          ? between(midway, shoulder, INCLINES.midway, INCLINES.shoulder)
          : between(hip, midway, INCLINES.hip, INCLINES.midway);
    const inclined: number =
      incline ?? Math.min(RANGE, Math.max(lean, measured));

    // The sink that keeps each wrist within reach of its risen shoulder.
    const reach: number = body.measure.upperArm + body.measure.forearm;
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set([
      "leftUpperArm",
      "rightUpperArm",
    ]);
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      poseBones(
        body,
        resolveHumanPosture.seeded(
          body,
          AutoMovieMotionHumanTrunk.sunk(body, standing, 0, inclined, 0),
          undefined,
          {},
          undefined,
          requested,
        ).pose,
        undefined,
        requested,
      );
    let sink: number = 0;
    for (const side of ["left", "right"] as const) {
      const at: IAutoMovieVector3 = bones.get(`${side}UpperArm`)!.worldPosition;
      const flat: number = Math.hypot(
        asked[side].x - at.x,
        asked[side].z - at.z,
      );
      if (flat < reach)
        sink = Math.max(
          sink,
          at.y + rise - asked[side].y - Math.sqrt(reach * reach - flat * flat),
        );
    }
    return { incline: inclined, sink };
  }

  /**
   * The floor a push stands on: the height of the entry's lower sole, world
   * metres, from which a handle's height is read.
   *
   * @param body The body.
   * @param feet Each foot at the entry.
   * @returns The floor's height, world metres.
   */
  export function floor(
    body: IAutoMovieMotionHumanBody,
    feet: IAutoMovieMotionHumanEntryState["feet"],
  ): number {
    return Math.min(
      ...(["left", "right"] as const).map(
        (foot: AutoMovieHumanSide): number =>
          feet[foot].ankle.y +
          Quaternion.rotateVector(
            feet[foot].rotation,
            HumanFoot.offset(body, foot, "sole"),
          ).y,
      ),
    );
  }
}

/**
 * The display-rate rise observes only the current world's authored root
 * position.
 */
const ROOT_CHANNELS: readonly ["root"] = ["root"];
