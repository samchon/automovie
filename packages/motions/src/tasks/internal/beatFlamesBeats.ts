import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * The beats that smother flames on a region: the cloth's face comes down to
 * `CLEAR` above the region's surface along its outward normal, and each beat
 * starts `RAISE` above that, comes down at its middle and rises again, `count`
 * times over the stroke, `0.5 + 0.5 cos(2 pi count u)` of the way up at the
 * stroke's progress `u`.
 * Parameter count: The beats asked, rounded; `COUNT` when absent.
 * Parameter region: The burning region's surface point and outward normal.
 * Returns: The beats' count, their low and high faces and the face at a
 * progress.
 * When the count rounds to no positive whole number.
 */
export function beatFlamesBeats(
  count: number | undefined,
  region: beatFlamesBeats.IRegion,
): beatFlamesBeats.IBeats {
  const beats: number = Math.round(count ?? beatFlamesBeats.COUNT);
  if (!(beats > 0))
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "count",
      value: beats,
      feasible: {
        kind: "range",
        minimum: 1,
        maximum: Number.MAX_SAFE_INTEGER,
        unit: "",
      },
      reason: "beats are a positive whole count",
      fix: "give a whole number of beats",
    });
  const down: IAutoMovieVector3 = Vector3.add(
    region.point,
    Vector3.scale(region.normal, beatFlamesBeats.CLEAR),
  );
  const up: IAutoMovieVector3 = Vector3.add(down, {
    x: 0,
    y: beatFlamesBeats.RAISE,
    z: 0,
  });
  return {
    count: beats,
    down,
    up,
    at: (u: number): IAutoMovieVector3 =>
      Vector3.lerp(
        down,
        up,
        0.5 + 0.5 * Math.cos(2 * Math.PI * beats * Math.min(1, Math.max(0, u))),
      ),
  };
}

/*
 * The flame beats.
 */
export namespace beatFlamesBeats {
  /*
   * Strokes when none are asked.
   */
  export const COUNT: number = 4;

  /*
   * How high each beat raises the cloth above the region, metres: provisional.
   */
  export const RAISE: number = 0.3;

  /*
   * How far above the region's surface the cloth's face comes down to, metres:
   * it smothers without pressing into the body.
   */
  export const CLEAR: number = 0.02;

  /*
   * The burning region's surface.
   */
  export interface IRegion {
    /*
     * Its surface point, world metres.
     */
    point: IAutoMovieVector3;

    /*
     * Its outward normal, unit.
     */
    normal: IAutoMovieVector3;
  }

  /*
   * The beats.
   */
  export interface IBeats {
    /*
     * The whole count.
     */
    count: number;

    /*
     * The face at its lowest, `CLEAR` off the region.
     */
    down: IAutoMovieVector3;

    /*
     * The face at its highest, `RAISE` above `down`.
     */
    up: IAutoMovieVector3;

    /*
     * The face at a stroke's progress.
     * Parameter u: The progress, clamped to [0, 1].
     * Returns: The face's point, world metres.
     */
    at(u: number): IAutoMovieVector3;
  }
}
