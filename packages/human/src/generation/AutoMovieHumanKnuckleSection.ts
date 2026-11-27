import { AutoMovieEnginePlanarHull } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanKnuckleSection,
} from "@automovie/interface";

/**
 * The hand's section through knuckles II and V on a meshed skin, as ANSUR II
 * and ISO 7250-1 measure hand breadth and hand circumference: the plane
 * through the knuckles' midpoint that holds the line from II to V and stands
 * square to the hand's axis from the wrist centre to knuckle III. The breadth
 * is the section's extent along that line, the circumference the perimeter of
 * its convex hull (a taut tape bridges every hollow).
 *
 * The hand's solve reads its chains cheaply; this reads the skin the surface
 * actually builds, the palm's rings and, at the borders, the webs' columns
 * that carry the border out to the index and little fingers' roots, so the
 * solve can be steered to what the skin measures.
 */
export namespace AutoMovieHumanKnuckleSection {
  /**
   * Measure a mesh's knuckle section.
   *
   * @param positions Flat vertex positions, mm.
   * @param indices Flat triangle indices.
   * @param mcps Knuckles II, III and V.
   * @param centre The wrist centre.
   */
  export function measure(
    positions: ArrayLike<number>,
    indices: ArrayLike<number>,
    mcps: IAutoMovieHumanKnuckleSection.MeasureMcps,
    centre: AutoMovieVector3Tuple,
  ): IAutoMovieHumanKnuckleSection.IMeasure {
    const [two, three, five] = mcps;
    const middle: AutoMovieVector3Tuple = scale(plus(two, five), 0.5);
    const axis: AutoMovieVector3Tuple = unit(sub(three, centre));
    const line: AutoMovieVector3Tuple = unit(sub(five, two));
    const normal: AutoMovieVector3Tuple = unit(
      sub(axis, scale(line, dot(axis, line))),
    );
    const other: AutoMovieVector3Tuple = cross(normal, line);
    const point = (v: number): AutoMovieVector3Tuple => [
      positions[3 * v]!,
      positions[3 * v + 1]!,
      positions[3 * v + 2]!,
    ];
    const points: [number, number][] = [];
    // Every triangle edge the plane crosses gives one section point; the
    // plane through the knuckles meets only the palm and its webs here, so no
    // component needs choosing.
    for (let t: number = 0; t < indices.length / 3; t++)
      for (let e: number = 0; e < 3; e++) {
        const p: AutoMovieVector3Tuple = point(indices[3 * t + e]!);
        const q: AutoMovieVector3Tuple = point(indices[3 * t + ((e + 1) % 3)]!);
        const fp: number = dot(sub(p, middle), normal);
        const fq: number = dot(sub(q, middle), normal);
        if (fp === fq || fp * fq > 0) continue;
        const x: AutoMovieVector3Tuple = sub(
          plus(p, scale(sub(q, p), fp / (fp - fq))),
          middle,
        );
        points.push([dot(x, line), dot(x, other)]);
      }
    if (points.length < 3)
      throw new Error("The knuckles' plane misses the hand's skin");
    const along: number[] = points.map((p: [number, number]): number => p[0]);
    return {
      breadth: Math.max(...along) - Math.min(...along),
      girth: AutoMovieEnginePlanarHull.perimeter(points, 0, 1),
    };
  }
}

function sub(
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
): AutoMovieVector3Tuple {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function plus(
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
): AutoMovieVector3Tuple {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(a: AutoMovieVector3Tuple, s: number): AutoMovieVector3Tuple {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function dot(a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
): AutoMovieVector3Tuple {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function unit(a: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
  const l: number = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
