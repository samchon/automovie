/**
 * The path of a swinging foot over a profile it must clear: the shortest
 * path from where it leaves to where it lands that stays on or above a
 * required height everywhere between, with its corners rounded.
 *
 * A foot stepping onto a stair, over a threshold or across an obstacle moves
 * in the vertical plane of its step. What it must clear is a height required
 * of its ankle at each place along the step (the surface under each point of
 * its sole there, plus the clearance near an edge). The shortest path above
 * such a profile is the taut string over it: the upper convex hull of the
 * profile between the two ends, which rises steeply beside a riser, runs
 * along the line of the nosings and drops once the sole is past the last
 * edge, as the foot's path on stairs does. The hull's corners are rounded
 * within `RADIUS` so the foot's direction turns smoothly, which lowers the
 * path by at most half the radius at a corner; the caller's clearance
 * carries that.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the path is, why the hull is the shortest clearing path, and what the rounding costs.
 * @evidence contracts/development/design.md#principled-representation A path in the step's vertical plane as a function of its share of arc length, from a required-height function.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The point type, two named constants and one builder; read by the stairs law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No obstacle shape is assumed: any required-height function is cleared.
 */
export namespace AutoMovieMotionHumanClearance {
  /** The most a corner of the path is cut back along each of its sides, metres (provisional). */
  export const RADIUS: number = 0.04;

  /** The spacing at which the required height is sampled along the step, metres. */
  export const SPACING: number = 0.001;

  /**
   * A point of the step's vertical plane.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its axis and unit.
   * @evidence contracts/development/design.md#principled-representation Two coordinates of the plane the foot moves in.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by `path`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain numbers.
   */
  export interface IPoint {
    /** Distance along the step, metres. */
    z: number;

    /** Height, metres. */
    y: number;
  }

  /**
   * The clearing path between two points.
   *
   * @param from Where the path starts.
   * @param to Where it ends; farther along the step than `from`.
   * @param required The least height at a distance along the step, metres; read strictly between the two ends.
   * @returns The path's point at a share of its arc length in [0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the ends, the required height and what the returned function reads.
   * @evidence contracts/development/implementation.md#principled-implementation The upper convex hull of the sampled profile and the two ends by a monotone chain, each corner replaced by a quadratic Bezier arc, read by arc length.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Sample, hull, round, measure, then one lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A step with no length is the straight line between its ends; the sampling spacing and the radius are named.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the samples to build; a binary search per read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The path is built once and read at every instant of the swing.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the rounded polyline and its lengths, a few dozen points.
   */
  export function path(
    from: IPoint,
    to: IPoint,
    required: (z: number) => number,
  ): (share: number) => IPoint {
    const span: number = to.z - from.z;
    if (!(span > 1e-6))
      return (share: number): IPoint => ({
        z: from.z + span * share,
        y: from.y + (to.y - from.y) * share,
      });

    // The upper hull of the ends and the profile between them.
    const count: number = Math.ceil(span / SPACING);
    const hull: IPoint[] = [];
    for (let i: number = 0; i <= count; i++) {
      const p: IPoint =
        i === 0
          ? from
          : i === count
            ? to
            : ((z: number): IPoint => ({ z, y: required(z) }))(
                from.z + (span * i) / count,
              );
      while (hull.length >= 2) {
        const a: IPoint = hull[hull.length - 2]!;
        const b: IPoint = hull[hull.length - 1]!;
        if ((b.z - a.z) * (p.y - a.y) - (b.y - a.y) * (p.z - a.z) < 0) break;
        hull.pop();
      }
      hull.push(p);
    }

    // Each corner cut back along its two sides and bridged by an arc.
    const line: IPoint[] = [hull[0]!];
    for (let i: number = 1; i + 1 < hull.length; i++) {
      const v: IPoint = hull[i]!;
      const back: IPoint = hull[i - 1]!;
      const ahead: IPoint = hull[i + 1]!;
      const before: number = Math.hypot(v.z - back.z, v.y - back.y);
      const after: number = Math.hypot(ahead.z - v.z, ahead.y - v.y);
      const r: number = Math.min(RADIUS, before / 2, after / 2);
      const p0: IPoint = toward(v, back, r / before);
      const p2: IPoint = toward(v, ahead, r / after);
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
          Math.hypot(
            line[i]!.z - line[i - 1]!.z,
            line[i]!.y - line[i - 1]!.y,
          ),
      );
    const total: number = lengths[lengths.length - 1]!;
    return (share: number): IPoint => {
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
    };
  }

  /** Segments of a corner's arc. */
  const ARC: number = 8;

  /** A point a share of the way from one point to another. */
  const toward = (a: IPoint, b: IPoint, share: number): IPoint => ({
    z: a.z + (b.z - a.z) * share,
    y: a.y + (b.y - a.y) * share,
  });
}
