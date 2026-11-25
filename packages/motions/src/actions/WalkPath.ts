import type { IAutoMovieVector3 } from "@automovie/interface";

/** A fixed floor polyline by arc length, the path a stepping gait follows. */
export class WalkPath {
  /** Cumulative arc length at each point. */
  private readonly cumulative: number[];

  /** Fixed differences and original cumulative-length spans, in point order. */
  private readonly segments: readonly ISegment[];

  /** Total length, metres. */
  public readonly length: number;

  /**
   * @param points The fixed floor points in order, world metres; keep them
   *   unchanged until this path is released.
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
    this.segments = points
      .slice(1)
      .map((point: IAutoMovieVector3, i: number): ISegment => {
        const span: number = this.cumulative[i + 1]! - this.cumulative[i]!;
        return {
          from: points[i]!,
          dx: point.x - points[i]!.x,
          dz: point.z - points[i]!.z,
          span,
          squared: span * span,
        };
      });
  }

  /**
   * The point at an arc length, clamped to the ends.
   *
   * @param s Arc length, metres.
   * @returns The floor point.
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
                ((point.x - a.x) * segment.dx + (point.z - a.z) * segment.dz) /
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
   * The heading of the chord across an arc length's neighbourhood, degrees
   * about +Y (0 faces +Z).
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
  /** The segment's first point, world metres. */
  from: IAutoMovieVector3;

  /** The segment's x extent, metres. */
  dx: number;

  /** The segment's z extent, metres. */
  dz: number;

  /**
   * The segment's arc length, metres, as the difference of the cumulative
   * lengths at its ends.
   */
  span: number;

  /** The arc length squared, square metres, the projection's denominator. */
  squared: number;
}
