import {
  AutoMovieConicArcField as Conic,
  AutoMovieConicFieldJet as Jet,
  AutoMovieBernsteinRational64 as Rational,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type {
  IAutoMovieRationalBernsteinVector64,
  AutoMovieVector3Tuple as P3,
  IAutoMovieSolidSurface as Solid,
} from "@automovie/interface";

/** Two conic arcs through the person's fork tangents and medial saddle. */
export function AutoMovieHumanPelvicSaddle(
  fork: readonly [Solid.IJet, Solid.IJet],
  point: P3,
  normal: P3,
  forward: P3,
  chordMm: number,
) {
  const [first, last] = fork;
  const chord: P3 | null = Vec.unit(Vec.sub(last.p, first.p));
  if (chord === null) return "The pelvic forks coincide";
  const rays = fork.map(({ u, v }): P3 | null =>
    Vec.unit(Vec.cross(Vec.cross(u, v), normal)),
  );
  if (rays[0] === null || rays[1] === null)
    return "A pelvic fork tangent does not meet the median plane";
  const depth: number = Vec.dot(Vec.sub(point, first.p), forward);
  const lead: number = Vec.dot(rays[0]!, forward);
  const tail: number = Vec.dot(rays[1]!, forward);
  if (!(depth > 0 && lead !== 0 && tail !== 0))
    return "The native pelvic fork tangents do not support the measured saddle depth";
  const before: P3 = Vec.add(first.p, Vec.scale(rays[0]!, depth / lead));
  const after: P3 = Vec.add(last.p, Vec.scale(rays[1]!, depth / tail));
  const gaps: number[] = [first.p, before, point, after, last.p]
    .slice(1)
    .map((p, i): number =>
      Vec.dot(Vec.sub(p, [first.p, before, point, after][i]!), chord),
    );
  const orderingMargin: number = Math.min(...gaps);
  if (!(orderingMargin > 0))
    return "The measured pelvic saddle would make a cusp or an inflection between its fork tangents";

  // Gfrerrer and Weiss, 2020, pair two conic arcs through one intermediate
  // position. Here the native level of the nadir also gives its horizontal
  // tangent. At the nadir the two arcs have normal curvatures H/(2 w^2 b^2),
  // where H is the common depth and b each horizontal control reach. Equal
  // products w*b give equal curvature and speed with local unit clocks.
  // ESTIMATE. Normalize their product to one, splitting the one undetermined
  // weight scale equally in log weight, independently of the camera or asset.
  // https://doi.org/10.1016/j.cagd.2020.101904
  const weight: number = Math.sqrt(gaps[2]! / gaps[1]!);
  const left = arc(first.p, before, point, weight, chordMm);
  const right = arc(point, after, last.p, 1 / weight, chordMm);
  return {
    start: first.p,
    end: last.p,
    depth,
    orderingMargin,
    columns: 2 * Math.max(left.columns, right.columns),
    transverse: (): P3 => normal,
    at: (s: number) => {
      const read = s < 0.5 ? left.at(2 * s) : right.at(2 * s - 1);
      return { p: read.p, d: Vec.scale(read.d, 2) };
    },
    controls: [first.p, before, point, after, last.p],
    weights: [weight, 1 / weight],
    curvatureAtSaddle: depth / (2 * gaps[1]! * gaps[2]!),
  };
}

/** Affinely map the existing positive unit conic to the three physical controls. */
function arc(a: P3, b: P3, c: P3, w: number, chordMm: number) {
  const dx: P3 = Vec.sub(b, c);
  const dy: P3 = Vec.sub(b, a);
  // Exact homogeneous subdivision tightens the quotient bound over each third.
  // Local second derivatives are one ninth of the original-clock derivatives.
  const pieces = Rational.thirdsR({
    numerator: [[0, 0, 0], Vec.scale(dy, w), Vec.sub(c, a)],
    denominator: [1, w, 1],
  });
  const acceleration: number = 9 * Math.max(...pieces.map(accelerationBound));
  const columns: number = Math.ceil(Math.sqrt(acceleration / (8 * chordMm)));
  return {
    columns,
    at(t: number) {
      const [x, y] = Conic.point(Jet.NUMBER, 1, 1, w, t);
      const [vx, vy] = Conic.velocity(Jet.NUMBER, 1, 1, w, t);
      return {
        p: Vec.combine([
          [1, a],
          [x - 1, dx],
          [y, dy],
        ]),
        d: Vec.combine([
          [-vx, dx],
          [vy, dy],
        ]),
      };
    },
  };
}

/** Certified interpolation remainder from the positive rational control hull. */
function accelerationBound({
  numerator,
  denominator,
}: IAutoMovieRationalBernsteinVector64): number {
  const [a, b, c] = denominator as [number, number, number];
  const origin: P3 = Vec.scale(numerator[0]!, 1 / a);
  const n1: P3 = Vec.sub(numerator[1]!, Vec.scale(origin, b));
  const n2: P3 = Vec.sub(numerator[2]!, Vec.scale(origin, c));
  const extent: number = Math.max(Vec.norm(n1) / b, Vec.norm(n2) / c);
  const rate: number = 2 * Math.max(Vec.norm(n1), Vec.norm(Vec.sub(n2, n1)));
  const acceleration: number = 2 * Vec.norm(Vec.sub(n2, Vec.scale(n1, 2)));
  const q1: number = 2 * Math.max(Math.abs(b - a), Math.abs(c - b));
  const q2: number = 2 * Math.abs(a - 2 * b + c);
  const q: number = Math.min(a, b, c);
  const speed: number = (rate + extent * q1) / q;
  return (acceleration + 2 * speed * q1 + extent * q2) / q;
}
