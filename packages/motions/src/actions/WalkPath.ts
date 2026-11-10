import type { IAutoMovieVector3 } from "@automovie/interface";

/** A floor polyline by arc length, the path a stepping gait's footprints lie along. */
export class WalkPath {
  /** Cumulative arc length at each point. */
  private readonly cumulative: number[];

  /** Total length, metres. */
  public readonly length: number;

  /**
   * @param points The floor points in order, world metres.
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
    while (i < this.points.length - 1 && this.cumulative[i]! < c) i++;
    const a: IAutoMovieVector3 = this.points[i - 1]!;
    const b: IAutoMovieVector3 = this.points[i]!;
    const span: number = this.cumulative[i]! - this.cumulative[i - 1]!;
    const u: number = span < 1e-12 ? 0 : (c - this.cumulative[i - 1]!) / span;
    return { x: a.x + (b.x - a.x) * u, y: 0, z: a.z + (b.z - a.z) * u };
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
