/**
 * Outlying parts of a multi-part capture row (neighbours or the whole
 * figure). A part whose geometry lies far from the rest, such as a curve
 * evaluated in the wrong parameter or a frame placed metres away, would
 * otherwise widen the fitted camera until the figure shrinks to a few
 * pixels. The centre is the per-axis median of the parts' box centres, which
 * stays inside the figure while fewer than half the parts are outliers; a
 * part is an outlier when the farthest corner of its box lies more than
 * `limit` from that centre. The capture fits the row's cameras on the
 * inliers and names every outlier in the sheet header and the manifest.
 */
export namespace CaptureOutliers {
  /** Point, any consistent length unit. */
  export type Vec3 = [number, number, number];

  /** One part's axis-aligned bounds. */
  export interface IBounds {
    /** Part name. */
    name: string;

    /** Per-axis minimum. */
    low: Vec3;

    /** Per-axis maximum. */
    high: Vec3;
  }

  /** One outlying part. */
  export interface IOutlier {
    /** Part name. */
    name: string;

    /** Distance from the centre to the part's farthest box corner. */
    distance: number;

    /** Its bounds. */
    low: Vec3;

    /** Its bounds. */
    high: Vec3;
  }

  /** The classification of a row's parts. */
  export interface IOutput {
    /** Per-axis median of the box centres; null for no part. */
    centre: Vec3 | null;

    /** The distance limit used. */
    limit: number;

    /** Parts within the limit, in input order. */
    inliers: string[];

    /** Parts beyond it, in input order. */
    outliers: IOutlier[];

    /** Parts whose bounds are not finite (a NaN or infinite coordinate), in input order; they take no part in the centre. */
    invalid: string[];
  }

  /**
   * The plausible extent of a whole standing figure about a point inside it,
   * as a multiple of stature: the figure fits a box of height up to 1.25
   * stature (arms raised), width up to 1.06 stature (arm span, the upper end
   * of the span/stature ratio) and depth under 0.4 stature, whose diagonal is
   * sqrt(1.25^2 + 1.06^2 + 0.4^2) = 1.69 stature; 1.75 leaves a margin. The
   * median centre lies inside that box, so no point of a well-placed part is
   * farther than this from it.
   */
  export const STATURES: number = 1.75;

  /**
   * Classify parts against `limit` from the median of their box centres.
   * A part exactly at the limit is an inlier.
   */
  export function find(bounds: readonly IBounds[], limit: number): IOutput {
    if (!(limit > 0)) throw new Error("The outlier limit must be positive");
    const valid: IBounds[] = bounds.filter((b: IBounds): boolean => [...b.low, ...b.high].every(Number.isFinite));
    const invalid: string[] = bounds.filter((b: IBounds): boolean => !valid.includes(b)).map((b: IBounds): string => b.name);
    if (valid.length === 0) return { centre: null, limit, inliers: [], outliers: [], invalid };
    const centres: Vec3[] = valid.map((b: IBounds): Vec3 => [(b.low[0] + b.high[0]) / 2, (b.low[1] + b.high[1]) / 2, (b.low[2] + b.high[2]) / 2]);
    const centre: Vec3 = [median(centres.map((c: Vec3): number => c[0])), median(centres.map((c: Vec3): number => c[1])), median(centres.map((c: Vec3): number => c[2]))];
    const inliers: string[] = [];
    const outliers: IOutlier[] = [];
    for (const b of valid) {
      const far: number = Math.hypot(
        Math.max(Math.abs(b.low[0] - centre[0]), Math.abs(b.high[0] - centre[0])),
        Math.max(Math.abs(b.low[1] - centre[1]), Math.abs(b.high[1] - centre[1])),
        Math.max(Math.abs(b.low[2] - centre[2]), Math.abs(b.high[2] - centre[2])),
      );
      if (far > limit) outliers.push({ name: b.name, distance: far, low: b.low, high: b.high });
      else inliers.push(b.name);
    }
    return { centre, limit, inliers, outliers, invalid };
  }

  /**
   * Split points into the finite ones and the count of the others. A NaN or
   * infinite coordinate makes a fitted camera's target and scale NaN, which
   * projects every point of the frame off the canvas, so framing takes only
   * the finite points and the capture reports the rest.
   */
  export function finite(points: readonly Vec3[]): { points: Vec3[]; dropped: number } {
    const kept: Vec3[] = points.filter((p: Vec3): boolean => Number.isFinite(p[0]) && Number.isFinite(p[1]) && Number.isFinite(p[2]));
    return { points: kept, dropped: points.length - kept.length };
  }

  /** Bounds of points, or null for none. */
  export function bounds(name: string, points: readonly Vec3[]): IBounds | null {
    if (points.length === 0) return null;
    const low: Vec3 = [Infinity, Infinity, Infinity];
    const high: Vec3 = [-Infinity, -Infinity, -Infinity];
    for (const p of points)
      for (let c: number = 0; c < 3; ++c) {
        low[c] = Math.min(low[c]!, p[c]!);
        high[c] = Math.max(high[c]!, p[c]!);
      }
    return { name, low, high };
  }

  /** Median of a non-empty list: the middle value, or the mean of the two middle values. */
  function median(values: readonly number[]): number {
    const s: number[] = [...values].sort((a: number, b: number): number => a - b);
    const m: number = Math.floor(s.length / 2);
    return s.length % 2 === 1 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
  }
}
