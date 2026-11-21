import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { hipJoints } from "../posture/hipJoints";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { HumanMountedFrame } from "./HumanMountedFrame";
import type { HumanMountedSeats } from "./HumanMountedSeats";
import { HumanMountedStirrups } from "./HumanMountedStirrups";
import { HumanMountedStride } from "./HumanMountedStride";
import type { HumanMountedTimeline } from "./HumanMountedTimeline";

/**
 * The paths a mounted performance (`HumanMounted`) prepares between its key
 * postures: where the hips are, how far the carrier strays from its
 * stride-averaged path while the performance is out of the saddle, and which
 * feet must swing over the carrier on their way to the next figure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three prepared paths.
 * @evidence contracts/development/design.md#principled-representation World or carrier-frame points and metres, prepared once per plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three functions and the swing's rise, read by the mounted law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No carrier is named; its frame and colliders are read through the plan's readers.
 */
export namespace HumanMountedPaths {
  /** How far above the higher end of its way a foot that must swing over the carrier passes, thigh lengths (provisional). */
  export const RISE: number = 0.25;

  /**
   * The middle of a posture's hip joints.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns The point, in the posture's frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the point.
   * @evidence contracts/development/implementation.md#principled-implementation The two hip joints the root and attitude place (`hipJoints`), averaged.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function hips(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 {
    const joints: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
      body,
      posture.root,
      resolveHumanPosture.heading(posture),
      posture.joints.hips,
    );
    return Vector3.lerp(joints.left, joints.right, 0.5);
  }

  /**
   * How far the carrier contact rises or falls from its stride-averaged path while the performance is out of the saddle, read in world height so the course's own travel does not count.
   *
   * @param carrier The carrier frame reader.
   * @param start The performance's start, film seconds.
   * @param clock The performance's clock.
   * @param figures The figures.
   * @param stride The stride, seconds; none gives 0.
   * @returns The greatest departure, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is measured, over which spans and in which direction.
   * @evidence contracts/development/implementation.md#principled-implementation The contact's height against `HumanMountedStride.level`'s average, sampled `2 SAMPLES` times a stride over each out-of-saddle figure's transfer and hold.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One loop per figure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Seated figures are not read; a performance with no stride has no slack.
   * @evidence contracts/development/implementation.md#efficient-algorithms Sixteen samples a stride, each `SAMPLES` plus one carrier readings.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function slack(
    carrier: HumanMountedFrame.Reader,
    start: number,
    clock: HumanMountedTimeline,
    figures: readonly IAutoMovieMotionHumanMounted.IFigure[],
    stride: number | undefined,
  ): number {
    let most: number = 0;
    if (stride === undefined) return most;
    figures.forEach(
      (figure: IAutoMovieMotionHumanMounted.IFigure, i: number): void => {
        if (!HumanMountedStirrups.free(figure.seat)) return;
        const from: number = start + clock.starts[i]!;
        const span: number =
          clock.arrivals[i]! - clock.starts[i]! + figure.seconds;
        const count: number = Math.ceil(
          (2 * HumanMountedStride.SAMPLES * span) / stride,
        );
        for (let k: number = 0; k <= count; ++k) {
          const at: number = from + (k / count) * span;
          const level: IAutoMovieVector3 = HumanMountedStride.level(
            carrier,
            at,
            { x: 0, y: 0, z: 0 },
            stride,
          );
          most = Math.max(most, Math.abs(carrier(at).position.y - level.y));
        }
      },
    );
    return most;
  }

  /**
   * The feet that swing over the carrier into each figure: a foot whose straight way to its next place would pass through the carrier's colliders passes instead through a point above the higher end, `RISE` thighs up, midway along; a foot kept on the same stirrup stays on it.
   *
   * @param seats The seats' context, for the body and the colliders.
   * @param entry The entered posture in the carrier frame.
   * @param keys Each figure's key posture.
   * @param figures The figures.
   * @param planted Whether each entry foot stands on something.
   * @returns For each figure, the waypoint of each foot that swings.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when a foot swings and through which point.
   * @evidence contracts/development/implementation.md#principled-implementation Four collider distance queries along the straight way against the shank's radius; the waypoint is the middle of a quadratic arc the law adds to the blended ankle.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One loop per figure and side.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A foot kept on its stirrup never leaves it.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most four collider queries per foot per figure.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Read once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one small record per figure.
   */
  export function arcs(
    seats: HumanMountedSeats.IContext,
    entry: IAutoMovieMotionHumanPosture,
    keys: readonly IAutoMovieMotionHumanPosture[],
    figures: readonly IAutoMovieMotionHumanMounted.IFigure[],
    planted: Readonly<Record<AutoMovieHumanSide, boolean>>,
  ): Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>[] {
    const m: IAutoMovieMotionHumanBody["measure"] = seats.body.measure;
    return keys.map(
      (
        key: IAutoMovieMotionHumanPosture,
        i: number,
      ): Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> => {
        const out: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
        for (const side of ["left", "right"] as const) {
          const a: IAutoMovieVector3 | undefined = (
            i === 0 ? entry : keys[i - 1]!
          ).limbs[`${side}Leg`]?.point;
          const b: IAutoMovieVector3 | undefined =
            key.limbs[`${side}Leg`]?.point;
          const was: string | undefined =
            i === 0
              ? planted[side]
                ? figures[0]!.supports?.[`${side}Foot`]
                : undefined
              : figures[i - 1]!.supports?.[`${side}Foot`];
          if (
            a === undefined ||
            b === undefined ||
            Vector3.distance(a, b) < 1e-6 ||
            (was !== undefined && was === figures[i]!.supports?.[`${side}Foot`])
          )
            continue;
          let clear: boolean = true;
          for (let k: number = 0; k < 4 && clear; ++k)
            clear =
              seats.clear(
                Vector3.lerp(a, b, k / 4),
                Vector3.lerp(a, b, (k + 1) / 4),
              ) >= m.shankRadius;
          if (!clear)
            out[side] = {
              x: b.x,
              y: Math.max(a.y, b.y) + RISE * m.thigh,
              z: (a.z + b.z) / 2,
            };
        }
        return out;
      },
    );
  }
}
