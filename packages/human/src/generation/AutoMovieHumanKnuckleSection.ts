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
  /** A section's two measures, mm. */
  export interface IMeasure {
    /** Extent along the line from knuckle II to knuckle V. */
    breadth: number;

    /** Hull perimeter. */
    girth: number;
  }

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
    mcps: readonly [Vec3, Vec3, Vec3],
    centre: Vec3,
  ): IMeasure {
    const [two, three, five] = mcps;
    const middle: Vec3 = scale(plus(two, five), 0.5);
    const axis: Vec3 = unit(sub(three, centre));
    const line: Vec3 = unit(sub(five, two));
    const normal: Vec3 = unit(sub(axis, scale(line, dot(axis, line))));
    const other: Vec3 = cross(normal, line);
    const point = (v: number): Vec3 => [positions[3 * v]!, positions[3 * v + 1]!, positions[3 * v + 2]!];
    const points: [number, number][] = [];
    // Every triangle edge the plane crosses gives one section point; the
    // plane through the knuckles meets only the palm and its webs here, so no
    // component needs choosing.
    for (let t: number = 0; t < indices.length / 3; t++)
      for (let e: number = 0; e < 3; e++) {
        const p: Vec3 = point(indices[3 * t + e]!);
        const q: Vec3 = point(indices[3 * t + ((e + 1) % 3)]!);
        const fp: number = dot(sub(p, middle), normal);
        const fq: number = dot(sub(q, middle), normal);
        if (fp === fq || fp * fq > 0) continue;
        const x: Vec3 = sub(plus(p, scale(sub(q, p), fp / (fp - fq))), middle);
        points.push([dot(x, line), dot(x, other)]);
      }
    if (points.length < 3) throw new Error("The knuckles' plane misses the hand's skin");
    const along: number[] = points.map((p: [number, number]): number => p[0]);
    return { breadth: Math.max(...along) - Math.min(...along), girth: hull(points) };
  }
}

/** A point or direction. */
type Vec3 = [number, number, number];

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function plus(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function unit(a: Vec3): Vec3 {
  const l: number = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

/** Perimeter of the convex hull of points in a plane (monotone chain). */
function hull(points: readonly [number, number][]): number {
  const p: [number, number][] = [...points].sort(
    (u: [number, number], v: [number, number]): number => u[0] - v[0] || u[1] - v[1],
  );
  const turn = (o: [number, number], a: [number, number], b: [number, number]): number =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const chain = (list: [number, number][]): [number, number][] => {
    const out: [number, number][] = [];
    for (const q of list) {
      while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, q) <= 0) out.pop();
      out.push(q);
    }
    return out;
  };
  const ring: [number, number][] = [...chain(p).slice(0, -1), ...chain([...p].reverse()).slice(0, -1)];
  let sum: number = 0;
  ring.forEach((q: [number, number], i: number): void => {
    const r: [number, number] = ring[(i + 1) % ring.length]!;
    sum += Math.hypot(r[0] - q[0], r[1] - q[1]);
  });
  return sum;
}
