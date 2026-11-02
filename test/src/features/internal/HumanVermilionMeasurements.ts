/** Independent Euclidean lip dimensions at the consumer's colour-border crossings. */
export namespace HumanVermilionMeasurements {
  /** A point in the same millimetre frame as the final median skin. */
  export type Point = [number, number, number];

  /** Final skin locations and their distances from the independently read stomion. */
  export interface IReading {
    /** Upper vermilion-border midpoint on the final skin. */
    ls: Point;

    /** Lower vermilion-border midpoint on the final skin. */
    li: Point;

    /** Three-dimensional ls-to-stomion distance, mm. */
    upper: number;

    /** Three-dimensional stomion-to-li distance, mm. */
    lower: number;
  }

  /**
   * Intersect the actual closed colour boundary with the median plane, then
   * read the independently emitted skin at those two heights. The boundary
   * locates the colour transition; its stored depth is never the answer.
   * Missing or ambiguous crossings and missing skin stay non-finite failures.
   */
  export function read(
    boundary: readonly Point[],
    median: readonly (readonly Point[])[],
    stomion: Point,
  ): IReading {
    const missing: Point = [NaN, NaN, NaN];
    const crosses: Point[] = [];
    const append: (point: Point) => void = (point: Point): void => {
      if (!crosses.some((previous: Point): boolean => distance(previous, point) < 1e-6)) crosses.push(point);
    };
    for (let k: number = 0; k < boundary.length; k++) {
      const a: Point = boundary[k]!;
      const b: Point = boundary[(k + 1) % boundary.length]!;
      if (Math.abs(a[2]) <= 1e-10) append(a);
      if ((a[2] > 0) !== (b[2] > 0) && Math.abs(a[2] - b[2]) > 1e-10)
        append(lerp(a, b, a[2] / (a[2] - b[2])));
    }
    const upper: Point[] = crosses.filter((point: Point): boolean => point[1] > stomion[1]);
    const lower: Point[] = crosses.filter((point: Point): boolean => point[1] < stomion[1]);
    const ls: Point = upper.length === 1 ? skinAt(median, upper[0]!) : missing;
    const li: Point = lower.length === 1 ? skinAt(median, lower[0]!) : missing;
    return { ls, li, upper: distance(ls, stomion), lower: distance(stomion, li) };
  }

  /** Actual final median position nearest the owned boundary's front-side address. */
  function skinAt(median: readonly (readonly Point[])[], guide: Point): Point {
    let best: Point = [NaN, NaN, NaN];
    let nearest: number = Infinity;
    for (const line of median) {
      for (let k: number = 0; k + 1 < line.length; k++) {
        const a: Point = line[k]!;
        const b: Point = line[k + 1]!;
        if (guide[1] < Math.min(a[1], b[1]) || guide[1] > Math.max(a[1], b[1])) continue;
        if (a[1] === b[1]) continue;
        const point: Point = lerp(a, b, (guide[1] - a[1]) / (b[1] - a[1]));
        const delta: number = distance(point, guide);
        if (delta < nearest) { nearest = delta; best = point; }
      }
    }
    return best;
  }

  /** Linear interpolation of independent sampled geometry. */
  function lerp(a: Point, b: Point, t: number): Point {
    return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])];
  }

  /** Physical three-dimensional distance; invalid coordinates propagate NaN. */
  function distance(a: Point, b: Point): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }
}
