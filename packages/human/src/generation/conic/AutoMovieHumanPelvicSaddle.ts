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
  osculate: boolean = false,
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
  const tailDepth: number = osculate
    ? Vec.dot(Vec.sub(point, last.p), forward)
    : depth;
  const after: P3 = Vec.add(last.p, Vec.scale(rays[1]!, tailDepth / tail));
  const osculation = osculate
    ? osculating(fork, [before, after], normal)
    : null;
  if (typeof osculation === "string") return osculation;
  const nadir: P3 = osculation?.nadir ?? point;
  const controls: P3[] = [first.p, before, nadir, after, last.p];
  const gaps: number[] = controls
    .slice(1)
    .map((p, i): number => Vec.dot(Vec.sub(p, controls[i]!), chord));
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
  const weights: [number, number] = osculation?.weights ?? [weight, 1 / weight];
  const left = arc(first.p, before, nadir, weights[0], chordMm);
  const right = arc(nadir, after, last.p, weights[1], chordMm);
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
    controls,
    weights,
    curvatureAtSaddle:
      osculation?.curvature ?? depth / (2 * gaps[1]! * gaps[2]!),
  };
}

/** Equal conic curvature at the measured level with both native fork jets held. */
function osculating(
  fork: readonly [Solid.IJet, Solid.IJet],
  handles: readonly [P3, P3],
  plane: P3,
) {
  const spans = fork.map(({ p }, i) => Vec.sub(handles[i]!, p));
  const lengths = spans.map(Vec.norm);
  const curves = fork.map((j, i): number => {
    const ray: P3 = Vec.scale(spans[i]!, 1 / lengths[i]!);
    const { u, v, uu, uv, vv } = j;
    const mixed = Vec.dot(u, v);
    const [a, b] = Vec.solve2(Vec.dot(u, u), mixed, mixed, Vec.dot(v, v), [
      Vec.dot(ray, u),
      Vec.dot(ray, v),
    ])!;
    const n = Vec.unit(Vec.cross(u, v))!;
    return Vec.dot(
      n,
      Vec.combine([
        [a * a, uu],
        [2 * a * b, uv],
        [b * b, vv],
      ]),
    );
  });
  if (curves.some((k): boolean => !(k > 0)))
    return "The native fork curvatures do not support two convex conic arcs";

  // The rational quadratic's curvature ratio at its two ends is the inverse
  // cube of the tangent-control reaches. Both inside handles lie in the exact
  // perineal datum, so equality gives the nadir directly on their shared line.
  // Gfrerrer and Weiss (2020), https://doi.org/10.1016/j.cagd.2020.101904
  const rates = curves.map((k, i): number => Math.cbrt(k) * lengths[i]!);
  const nadir = Vec.combine([
    [rates[1]! / (rates[0]! + rates[1]!), handles[0]],
    [rates[0]! / (rates[0]! + rates[1]!), handles[1]],
  ]);
  const weights = fork.map(({ p }, i): number => {
    const twiceArea = Math.abs(
      Vec.dot(plane, Vec.cross(spans[i]!, Vec.sub(nadir, p))),
    );
    return Math.sqrt(twiceArea / (2 * curves[i]! * lengths[i]! ** 3));
  });
  const curvature: number =
    curves[0]! * (lengths[0]! / Vec.norm(Vec.sub(nadir, handles[0]))) ** 3;
  return {
    nadir,
    curvature,
    weights: [weights[0]!, weights[1]!] as [number, number],
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
