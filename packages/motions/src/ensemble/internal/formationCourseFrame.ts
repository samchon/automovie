import type {
  IAutoMovieMotionHumanFormation,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A course frame at a second: linear between its samples, heading the way it
 * moves (or as its samples say), kept while it stands.
 *
 * Moved unchanged from `HumanFormation` to keep that file under the
 * repository's 500-line limit; its caller and behaviour are unchanged.
 */
export function formationCourseFrame(
  frame: IAutoMovieMotionHumanFormation.ICourse,
  seconds: number,
): formationCourseFrame.IPlace {
  const s: readonly IAutoMovieMotionHumanFormation.ISample[] = frame.samples;
  if (s.length === 0) throw new RangeError("A course frame has no samples");

  // The last span start at or before the second, at most the second to last
  // sample, found by bisection: a steered crowd's course holds a sample
  // every film frame, and every member reads it at every frame.
  let i: number = 0;
  let hi: number = Math.max(0, s.length - 2);
  while (i < hi) {
    const mid: number = (i + hi + 1) >> 1;
    if (s[mid]!.seconds <= seconds) i = mid;
    else hi = mid - 1;
  }
  const a: IAutoMovieMotionHumanFormation.ISample = s[i]!;
  const b: IAutoMovieMotionHumanFormation.ISample =
    s[Math.min(i + 1, s.length - 1)]!;
  const span: number = b.seconds - a.seconds;
  const u: number =
    span <= 0 ? 0 : Math.min(1, Math.max(0, (seconds - a.seconds) / span));
  // A course that carries its headings (a wheel) turns as they say, read
  // between samples along the shorter arc, so two samples written either
  // side of the ±180 seam do not spin the frame the long way round.
  if (a.heading !== undefined && b.heading !== undefined)
    return {
      at: {
        x: a.x + (b.x - a.x) * u,
        y: a.y + (b.y - a.y) * u,
        z: a.z + (b.z - a.z) * u,
      },
      heading:
        a.heading + (((((b.heading - a.heading) % 360) + 540) % 360) - 180) * u,
    };
  const heading = (k: number): number | null => {
    const p: IAutoMovieMotionHumanFormation.ISample = s[k]!;
    const q: IAutoMovieMotionHumanFormation.ISample = s[k + 1]!;
    return Math.hypot(q.x - p.x, q.z - p.z) < 1e-9
      ? null
      : (Math.atan2(q.x - p.x, q.z - p.z) * 180) / Math.PI;
  };
  let yaw: number | null = null;
  for (let k: number = Math.min(i, s.length - 2); k >= 0 && yaw === null; --k)
    yaw = heading(k);
  for (
    let k: number = Math.min(i, s.length - 2) + 1;
    k < s.length - 1 && yaw === null;
    ++k
  )
    yaw = heading(k);
  return {
    at: {
      x: a.x + (b.x - a.x) * u,
      y: a.y + (b.y - a.y) * u,
      z: a.z + (b.z - a.z) * u,
    },
    heading: yaw ?? 0,
  };
}

/** Companion types of `formationCourseFrame`. */
export namespace formationCourseFrame {
  /**
   * A frame's origin and heading at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the world-metre origin and the heading in degrees.
   * @evidence contracts/development/design.md#principled-representation A world point and a heading about +Y from +Z.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by formationCourseFrame and read by HumanFormation's placement.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only the two values a placement reads.
   */
  export interface IPlace {
    /** The frame's origin, world metres. */
    at: IAutoMovieVector3;

    /** The frame's heading, degrees about +Y from +Z. */
    heading: number;
  }
}
