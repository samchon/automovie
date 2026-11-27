import type { IAutoMovieMotionHumanClearance } from "@automovie/interface";

/*
 * The path of a swinging foot over a profile it must clear: the shortest path
 * from where it leaves to where it lands that stays on or above a required
 * height everywhere between, with its corners rounded.
 *
 * A foot stepping onto a stair, over a threshold or across an obstacle moves in
 * the vertical plane of its step. What it must clear is a height required of
 * its ankle at each place along the step (the surface under each point of its
 * sole there, plus the clearance near an edge). The shortest path above such a
 * profile is the taut string over it: the upper convex hull of the profile
 * between the two ends, which rises steeply beside a riser, runs along the line
 * of the nosings and drops once the sole is past the last edge, as the foot's
 * path on stairs does. The hull's corners are rounded within `RADIUS` so the
 * foot's direction turns smoothly, which lowers the path by at most half the
 * radius at a corner; the caller's clearance carries that.
 */
export namespace AutoMovieMotionHumanClearance {
  /*
   * The most a corner of the path is cut back along each of its sides, metres
   * (provisional).
   */
  export const RADIUS: number = 0.04;

  /*
   * The spacing at which the required height is sampled along the step, metres.
   */
  export const SPACING: number = 0.001;

  /*
   * The clearing path between two points.
   * Parameter from: Where the path starts.
   * Parameter to: Where it ends; farther along the step than `from`.
   * Parameter required: The least height at a distance along the step, metres; read
   * strictly between the two ends.
   * Returns: The path's point at a share of its arc length in [0, 1], with the
   * share at which it first stands a height above its start
   * (`IPath.lifted`).
   */
  export function path(
    from: IAutoMovieMotionHumanClearance.IPoint,
    to: IAutoMovieMotionHumanClearance.IPoint,
    required: (z: number) => number,
  ): IPath {
    const span: number = to.z - from.z;
    if (!(span > 1e-6))
      return Object.assign(
        (share: number): IAutoMovieMotionHumanClearance.IPoint => ({
          z: from.z + span * share,
          y: from.y + (to.y - from.y) * share,
        }),
        {
          lifted: (height: number): number =>
            to.y - from.y >= height ? Math.min(1, height / (to.y - from.y)) : 1,
        },
      );

    // The upper hull of the ends and the profile between them.
    const count: number = Math.ceil(span / SPACING);
    const hull: IAutoMovieMotionHumanClearance.IPoint[] = [];
    for (let i: number = 0; i <= count; i++) {
      const p: IAutoMovieMotionHumanClearance.IPoint =
        i === 0
          ? from
          : i === count
            ? to
            : ((z: number): IAutoMovieMotionHumanClearance.IPoint => ({
                z,
                y: required(z),
              }))(from.z + (span * i) / count);
      while (hull.length >= 2) {
        const a: IAutoMovieMotionHumanClearance.IPoint = hull[hull.length - 2]!;
        const b: IAutoMovieMotionHumanClearance.IPoint = hull[hull.length - 1]!;
        if ((b.z - a.z) * (p.y - a.y) - (b.y - a.y) * (p.z - a.z) < 0) break;
        hull.pop();
      }
      hull.push(p);
    }

    // Each corner cut back along its two sides and bridged by an arc.
    const line: IAutoMovieMotionHumanClearance.IPoint[] = [hull[0]!];
    for (let i: number = 1; i + 1 < hull.length; i++) {
      const v: IAutoMovieMotionHumanClearance.IPoint = hull[i]!;
      const back: IAutoMovieMotionHumanClearance.IPoint = hull[i - 1]!;
      const ahead: IAutoMovieMotionHumanClearance.IPoint = hull[i + 1]!;
      const before: number = Math.hypot(v.z - back.z, v.y - back.y);
      const after: number = Math.hypot(ahead.z - v.z, ahead.y - v.y);
      const r: number = Math.min(RADIUS, before / 2, after / 2);
      const p0: IAutoMovieMotionHumanClearance.IPoint = toward(
        v,
        back,
        r / before,
      );
      const p2: IAutoMovieMotionHumanClearance.IPoint = toward(
        v,
        ahead,
        r / after,
      );
      for (let k: number = 0; k <= ARC; k++) {
        const t: number = k / ARC;
        line.push({
          z: (1 - t) * (1 - t) * p0.z + 2 * t * (1 - t) * v.z + t * t * p2.z,
          y: (1 - t) * (1 - t) * p0.y + 2 * t * (1 - t) * v.y + t * t * p2.y,
        });
      }
    }
    line.push(hull[hull.length - 1]!);

    const lengths: number[] = [0];
    for (let i: number = 1; i < line.length; i++)
      lengths.push(
        lengths[i - 1]! +
          Math.hypot(line[i]!.z - line[i - 1]!.z, line[i]!.y - line[i - 1]!.y),
      );
    const total: number = lengths[lengths.length - 1]!;
    return Object.assign(
      (share: number): IAutoMovieMotionHumanClearance.IPoint => {
        const s: number = Math.max(0, Math.min(1, share)) * total;
        let lo: number = 0;
        let hi: number = line.length - 1;
        while (hi - lo > 1) {
          const mid: number = (lo + hi) >> 1;
          if (lengths[mid]! <= s) lo = mid;
          else hi = mid;
        }
        const piece: number = lengths[hi]! - lengths[lo]!;
        return toward(
          line[lo]!,
          line[hi]!,
          piece > 0 ? (s - lengths[lo]!) / piece : 0,
        );
      },
      {
        // The first share of arc length at which the path stands `height`
        // above its start: one walk along the rounded polyline to the first
        // piece that reaches it, interpolated within that piece.
        lifted: (height: number): number => {
          for (let i: number = 1; i < line.length; i++) {
            const rise: number = line[i]!.y - from.y;
            if (rise < height) continue;
            const before: number = line[i - 1]!.y - from.y;
            const within: number =
              rise > before ? (height - before) / (rise - before) : 0;
            return total > 0
              ? (lengths[i - 1]! + within * (lengths[i]! - lengths[i - 1]!)) /
                  total
              : 1;
          }
          return 1;
        },
      },
    );
  }

  /*
   * A clearing path: its point at a share of its arc length, and the first
   * share at which it stands a height above its start.
   */
  export interface IPath {
    /*
     * The path's point at a share of its arc length in [0, 1].
     */
    (share: number): IAutoMovieMotionHumanClearance.IPoint;

    /*
     * The first share of arc length at which the path stands `height` metres
     * above its start, interpolated within the polyline piece that first
     * reaches it; 1 when it never does, and 1 for a path of zero length.
     */
    lifted: (height: number) => number;
  }

  /*
   * Segments of a corner's arc.
   */
  const ARC: number = 8;

  /*
   * A point a share of the way from one point to another.
   */
  const toward = (
    a: IAutoMovieMotionHumanClearance.IPoint,
    b: IAutoMovieMotionHumanClearance.IPoint,
    share: number,
  ): IAutoMovieMotionHumanClearance.IPoint => ({
    z: a.z + (b.z - a.z) * share,
    y: a.y + (b.y - a.y) * share,
  });
}
