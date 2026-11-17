import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A fixed floor polyline by arc length, the path a stepping gait follows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines world-metre floor geometry, fixed point ordering, arc-length/clamped position, chord heading and first-tied nearest projection.
 * @evidence contracts/development/design.md#principled-representation Ordered authored points and cumulative lengths describe the exact unsimplified path; fixed segment deltas and denominator squares are numerical prerequisites, not sampled positions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Constructor, length, at, nearest and heading serve the existing stepping/station planners; prepared segment records remain private.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No corner is removed, length rounded, projection candidate skipped or path answer retained; callers keep the supplied fixed points unchanged for this path's lifetime.
 */
export class WalkPath {
  /** Cumulative arc length at each point. */
  private readonly cumulative: number[];

  /** Fixed differences and original cumulative-length spans, in point order. */
  private readonly segments: readonly ISegment[];

  /** Total length, metres. */
  public readonly length: number;

  /**
   * @param points The fixed floor points in order, world metres; keep them unchanged until this path is released.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines ordered fixed world-metre inputs and the resulting cumulative/segment geometry lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Retains each original ordered hypot and cumulative sum, then stores every span as that same cumulative difference and each exact coordinate delta/denominator square for later interpolation/projection.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cumulative-length pass and one segment-prerequisite pass precede unchanged position/nearest/heading readers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Spans use cumulative differences as before, retaining their exact arithmetic rather than substituting independently measured lengths; repeated points and all authored corners remain.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear preparation/storage in N points removes fixed coordinate subtraction, cumulative subtraction and denominator squaring from repeated path/nearest queries.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The callers own one unchanged authored floor polyline; each segment's deltas, span and squared span therefore remain valid while every current projected point/distance is evaluated normally.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One path retains its supplied fixed points and O(N) private scalar records until its take/station releases it; no queried position, nearest answer or time history is stored.
   */
  public constructor(private readonly points: readonly IAutoMovieVector3[]) {
    this.cumulative = [0];
    for (let i: number = 1; i < points.length; i++)
      this.cumulative.push(
        this.cumulative[i - 1]! +
          Math.hypot(
            points[i]!.x - points[i - 1]!.x,
            points[i]!.z - points[i - 1]!.z,
          ),
      );
    this.length = this.cumulative.at(-1)!;
    this.segments = points.slice(1).map((point: IAutoMovieVector3, i: number): ISegment => {
      const span: number = this.cumulative[i + 1]! - this.cumulative[i]!;
      return { from: points[i]!, dx: point.x - points[i]!.x, dz: point.z - points[i]!.z, span, squared: span * span };
    });
  }

  /**
   * The point at an arc length, clamped to the ends.
   *
   * @param s Arc length, metres.
   * @returns The floor point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States clamped arc-length input and the floor-point result.
   * @evidence contracts/development/implementation.md#principled-implementation Selects the first cumulative segment endpoint at or beyond the clamped length, then retains the original linear point interpolation and zero-span rule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lower-bound search precedes one segment interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Equal segment boundaries keep the first matching segment, including repeated points, with no path simplification.
   * @evidence contracts/development/implementation.md#efficient-algorithms Logarithmic segment selection and constant interpolation share constructor-prepared cumulative lengths, segment spans and exact coordinate deltas.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses this path's unchanged cumulative and segment geometry without retaining queried positions.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh point and retains no query state.
   */
  public at(s: number): IAutoMovieVector3 {
    const c: number = Math.min(this.length, Math.max(0, s));
    let i: number = 1;
    let high: number = this.points.length - 1;
    while (i < high) {
      const middle: number = (i + high) >>> 1;
      if (this.cumulative[middle]! < c) i = middle + 1;
      else high = middle;
    }
    const segment: ISegment = this.segments[i - 1]!;
    const a: IAutoMovieVector3 = segment.from;
    const span: number = segment.span;
    const u: number = span < 1e-12 ? 0 : (c - this.cumulative[i - 1]!) / span;
    return { x: a.x + segment.dx * u, y: 0, z: a.z + segment.dz * u };
  }

  /**
   * The arc length of the polyline's point nearest a floor point: each
   * segment's closest point, the nearest of them, the first on a tie.
   *
   * @param point The floor point, world metres; `y` is not read.
   * @returns Arc length, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines an actual world floor query, ignored Y, clamped segment projections and the first equal-distance winner's arc length.
   * @evidence contracts/development/implementation.md#principled-implementation Traverses every original segment in order, retaining the same dot-over-span-square projection, unit clamp, hypot distance and strict first-winner comparison.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered segment loop uses private fixed prerequisites and tracks only current least distance and its arc length.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains zero-span threshold, all candidates, exact multiply/add grouping and first tie; no spatial approximation or sampled nearest answer is used.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N) actual projections remain while fixed endpoint deltas, cumulative differences and squared denominators no longer repeat per query.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only this unchanged path's scalar segment geometry is shared; every projected query point and distance is actually computed.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Uses bounded loop locals and returns only one scalar arc length, retaining no query or external resource.
   */
  public nearest(point: IAutoMovieVector3): number {
    let best: number = 0;
    let least: number = Infinity;
    for (let i: number = 1; i < this.points.length; i++) {
      const segment: ISegment = this.segments[i - 1]!;
      const a: IAutoMovieVector3 = segment.from;
      const span: number = segment.span;
      const u: number =
        span < 1e-12
          ? 0
          : Math.min(
              1,
              Math.max(
                0,
                ((point.x - a.x) * segment.dx +
                  (point.z - a.z) * segment.dz) /
                  segment.squared,
              ),
            );
      const d: number = Math.hypot(
        a.x + segment.dx * u - point.x,
        a.z + segment.dz * u - point.z,
      );
      if (d < least) {
        least = d;
        best = this.cumulative[i - 1]! + u * span;
      }
    }
    return best;
  }

  /**
   * The heading of the chord across an arc length's neighbourhood, degrees about +Y (0 faces +Z).
   *
   * @param s Arc length, metres.
   * @param width Half the neighbourhood, metres.
   * @returns The heading.
   */
  public heading(s: number, width: number): number {
    const w: number = Math.max(width, 1e-3);
    let lo: number = s - w;
    let hi: number = s + w;
    if (lo < 0) [lo, hi] = [0, 2 * w];
    if (hi > this.length)
      [lo, hi] = [Math.max(0, this.length - 2 * w), this.length];
    const a: IAutoMovieVector3 = this.at(lo);
    const b: IAutoMovieVector3 = this.at(hi);
    return (Math.atan2(b.x - a.x, b.z - a.z) * 180) / Math.PI;
  }
}

/** Exact fixed prerequisites for one original floor-path segment. */
interface ISegment {
  from: IAutoMovieVector3;
  dx: number;
  dz: number;
  span: number;
  squared: number;
}
