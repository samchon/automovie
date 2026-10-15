import { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";
import { interpolateAutoMovieSpline } from "./interpolateAutoMovieSpline";

/** Most rest fits the girth solve runs. */
const MAX_ITERATIONS: number = 24;

/** Largest perimeter error the solve accepts, relative to the perimeter. */
const TOLERANCE: number = 1e-9;

/** Gauss-Legendre nodes on 0 to 1 and their weights, five points: exact for polynomials of degree nine. */
const GAUSS: ReadonlyArray<readonly [number, number]> = [
  [0.5 - 0.453089922969332, 0.118463442528095],
  [0.5 - 0.269234655052841, 0.239314335249683],
  [0.5, 0.284444444444444],
  [0.5 + 0.269234655052841, 0.239314335249683],
  [0.5 + 0.453089922969332, 0.118463442528095],
];

/**
 * Hold the limit perimeter of a surface network's girth rings, the rings
 * that declare `perimeter`, by solving a radial factor along each sweep.
 *
 * A girth ring runs once round one sweep at one `u`. Along a row of
 * valence-four vertices whose loop neighbours lie opposite, beside rows of
 * such vertices, the Catmull-Clark limit is the tensor-product cubic
 * B-spline, so the limit along the row is the periodic uniform cubic B-spline
 * whose control points are `(A + 4 P + B) / 6` for each vertex `P` and its
 * two neighbours `A` and `B` across the row; its perimeter is integrated by
 * five-point Gauss-Legendre quadrature on every span. Each sweep's factor is
 * the bounded spline of `interpolateAutoMovieSpline` through 1 at the sweep's
 * other rings at one `u`, which meet neighbouring parts and stay, and through
 * a value at each girth ring, holding its end values beyond the outermost
 * knots; `IAutoMovieSweepRig.girth` folds it into the scale. The girth
 * values solve the system "every measured perimeter equals its declaration"
 * jointly by Broyden's method (Broyden 1965, Mathematics of Computation
 * 19(92):577-593), one rest fit per step: the Jacobian starts diagonal, each
 * perimeter in proportion to its own factor, which is exact where the fit
 * interpolates the row and no neighbouring sample reads another factor, and
 * each step's rank-one update learns how neighbouring rings couple through
 * the spline, cell averages or a least-squares fit, so rings close together
 * converge together where updating each alone would oscillate or crawl; a
 * step that would make a factor non-positive is halved. It stops when every
 * perimeter is within 1e-9 of its declaration and refuses after 24 fits.
 *
 * @param props.network The network, only read.
 * @param props.rings Each ring's vertices in loop order, from the sampler.
 * @param props.faces The cage's quads, only read.
 * @param props.vertices Number of cage vertices.
 * @param props.sweepRig The rig of a sweep by name, sealed.
 * @param props.rest Evaluates the network at rest and writes the fitted control positions into `positions`.
 * @param props.positions Receives the rest control positions, `3 * vertices` numbers.
 * @throws Error when a girth ring's perimeter is not positive and finite, it also has positions, it does not run once round one sweep at one `u`, a vertex on or beside it is not a regular interior vertex, two rings of one sweep share a `u`, or the solve does not converge.
 *
 * @evidence contracts/common.md#principled-implementation The limit along a regular isoline is the tensor-product B-spline's isoline, measured by Gauss-Legendre quadrature; the correction is a smooth radial scale along the spine whose knot values solve the coupled perimeter equations by Broyden's quasi-Newton method from the exact uncoupled Jacobian.
 * @evidence contracts/common.md#clear-and-simple-design Validation, the regular-row check, the measurement and the iteration are one pass each; the factor lives in the sweep rig's scale, so samples, probes and poses read it without change.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A ring through an extraordinary vertex, where the isoline is not the B-spline, is refused instead of measured approximately; a solve that does not converge is refused.
 * @evidence contracts/common.md#meaningful-documentation States the ring's requirements, the measurement, the factor's knots and ends, the iteration, its exactness and its tolerance.
 * @evidence contracts/performance.md#efficient-algorithms O(F) to index the faces, then at most 24 rest fits plus O(R) quadrature for R ring vertices and O(G^3) for G girth rings each; no work without girth rings.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Runs once per rig compile; the factor it leaves is what every pose reuses.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; its O(F) adjacency is released on return.
 */
export const holdAutoMovieSurfaceGirths: (props: {
  network: IAutoMovieSurfaceNetwork;
  rings: Record<string, number[]>;
  faces: ReadonlyArray<readonly number[]>;
  vertices: number;
  sweepRig: (name: string) => IAutoMovieSweepRig;
  rest: (positions: Float64Array) => void;
  positions: Float64Array;
}) => void = (props: {
  network: IAutoMovieSurfaceNetwork;
  rings: Record<string, number[]>;
  faces: ReadonlyArray<readonly number[]>;
  vertices: number;
  sweepRig: (name: string) => IAutoMovieSweepRig;
  rest: (positions: Float64Array) => void;
  positions: Float64Array;
}): void => {
  const declared: IAutoMovieSurfaceNetwork.IRing[] = (
    props.network.rings ?? []
  ).filter(
    (ring: IAutoMovieSurfaceNetwork.IRing): boolean =>
      ring.perimeter !== undefined,
  );
  if (declared.length === 0) return;

  // the sweep and u of a ring running round one sweep at one u, or null
  const level = (
    ring: IAutoMovieSurfaceNetwork.IRing,
  ): { sweep: string; u: number; turn: number } | null => {
    const first: IAutoMovieSurfaceNetwork.IEdge | undefined = ring.edges[0];
    if (first === undefined || first.type !== "sweep") return null;
    let turn: number = 0;
    for (const edge of ring.edges) {
      if (
        edge.type !== "sweep" ||
        edge.sweep !== first.sweep ||
        edge.from.u !== first.from.u ||
        edge.to.u !== first.from.u
      )
        return null;
      turn += edge.to.v - edge.from.v;
    }
    return { sweep: first.sweep, u: first.from.u, turn };
  };

  // each vertex's neighbours, faces and boundary edges
  const neighbours: Array<Set<number>> = Array.from(
    { length: props.vertices },
    (): Set<number> => new Set(),
  );
  const valence: Int32Array = new Int32Array(props.vertices);
  const directed: Set<string> = new Set();
  const together: Set<string> = new Set();
  for (const face of props.faces)
    for (let k: number = 0; k < face.length; ++k) {
      const a: number = face[k]!;
      const b: number = face[(k + 1) % face.length]!;
      neighbours[a]!.add(b);
      neighbours[b]!.add(a);
      ++valence[a]!;
      directed.add(`${a},${b}`);
      for (const c of face) if (c !== a) together.add(`${a},${c}`);
    }
  const regular = (v: number): boolean => {
    if (valence[v] !== 4 || neighbours[v]!.size !== 4) return false;
    for (const w of neighbours[v]!)
      if (!directed.has(`${v},${w}`) || !directed.has(`${w},${v}`))
        return false;
    return true;
  };

  interface IGirth {
    name: string;
    sweep: string;
    u: number;
    perimeter: number;
    members: number[];
    across: Int32Array;
    value: number;
  }
  const girths: IGirth[] = declared.map(
    (ring: IAutoMovieSurfaceNetwork.IRing): IGirth => {
      const perimeter: number = ring.perimeter!;
      if (!(Number.isFinite(perimeter) && perimeter > 0))
        throw new Error(
          `ring ${ring.name} perimeter must be positive and finite`,
        );
      if (ring.positions !== undefined)
        throw new Error(
          `ring ${ring.name} cannot hold both positions and a perimeter`,
        );
      const at: { sweep: string; u: number; turn: number } | null = level(ring);
      if (at === null || Math.abs(Math.abs(at.turn) - 1) > 1e-9)
        throw new Error(
          `ring ${ring.name} must run once round one sweep at one u to hold a perimeter`,
        );
      const members: number[] = props.rings[ring.name]!;
      const m: number = members.length;
      const across: Int32Array = new Int32Array(2 * m);
      members.forEach((v: number, k: number): void => {
        const before: number = members[(k + m - 1) % m]!;
        const after: number = members[(k + 1) % m]!;
        if (
          !regular(v) ||
          !neighbours[v]!.has(before) ||
          !neighbours[v]!.has(after) ||
          together.has(`${before},${after}`)
        )
          throw new Error(
            `ring ${ring.name} runs through vertex ${v}, which is not a regular interior vertex of a straight row`,
          );
        const others: number[] = [...neighbours[v]!].filter(
          (w: number): boolean => w !== before && w !== after,
        );
        for (const w of others)
          if (!regular(w))
            throw new Error(
              `ring ${ring.name} runs beside vertex ${w}, which is not a regular interior vertex`,
            );
        across[2 * k] = others[0]!;
        across[2 * k + 1] = others[1]!;
      });
      return {
        name: ring.name,
        sweep: at.sweep,
        u: at.u,
        perimeter,
        members,
        across,
        value: 1,
      };
    },
  );

  // anchors: the other rings that run round a girth's sweep at one u
  const anchors: Map<string, number[]> = new Map();
  for (const ring of props.network.rings ?? []) {
    if (ring.perimeter !== undefined) continue;
    const at: { sweep: string; u: number; turn: number } | null = level(ring);
    if (
      at !== null &&
      girths.some((g: IGirth): boolean => g.sweep === at.sweep)
    )
      anchors.set(at.sweep, [...(anchors.get(at.sweep) ?? []), at.u]);
  }
  const sweeps: string[] = [
    ...new Set(girths.map((g: IGirth): string => g.sweep)),
  ];
  for (const sweep of sweeps) {
    const us: number[] = [
      ...(anchors.get(sweep) ?? []),
      ...girths
        .filter((g: IGirth): boolean => g.sweep === sweep)
        .map((g: IGirth): number => g.u),
    ];
    if (new Set(us).size !== us.length)
      throw new Error(`two rings of sweep ${sweep} share one u`);
  }

  // the limit perimeter along a girth ring: the periodic cubic B-spline of the row-averaged controls
  const measure = (g: IGirth): number => {
    const m: number = g.members.length;
    const q: Float64Array = new Float64Array(3 * m);
    g.members.forEach((v: number, k: number): void => {
      const a: number = g.across[2 * k]!;
      const b: number = g.across[2 * k + 1]!;
      for (let c: number = 0; c < 3; ++c)
        q[3 * k + c] =
          (props.positions[3 * a + c]! +
            4 * props.positions[3 * v + c]! +
            props.positions[3 * b + c]!) /
          6;
    });
    let length: number = 0;
    for (let k: number = 0; k < m; ++k)
      for (const [t, w] of GAUSS) {
        // derivative of the uniform cubic B-spline span from control k - 1 to k + 2
        const d0: number = -((1 - t) ** 2) / 2;
        const d1: number = (3 * t * t - 4 * t) / 2;
        const d2: number = (-3 * t * t + 2 * t + 1) / 2;
        const d3: number = (t * t) / 2;
        let dx: number = 0;
        let dy: number = 0;
        let dz: number = 0;
        [d0, d1, d2, d3].forEach((d: number, j: number): void => {
          const i: number = 3 * ((k - 1 + j + m) % m);
          dx += d * q[i]!;
          dy += d * q[i + 1]!;
          dz += d * q[i + 2]!;
        });
        length += w * Math.hypot(dx, dy, dz);
      }
    return length;
  };

  // Broyden's method on the residuals F(g) = measured - declared over the girth values g
  const n: number = girths.length;
  const jacobian: Float64Array = new Float64Array(n * n);
  const residual: Float64Array = new Float64Array(n);
  const previous: Float64Array = new Float64Array(n);
  const step: Float64Array = new Float64Array(n);
  for (let iteration: number = 0; iteration < MAX_ITERATIONS; ++iteration) {
    for (const sweep of sweeps) {
      const knots: Array<[number, number]> = [
        ...(anchors.get(sweep) ?? []).map((u: number): [number, number] => [
          u,
          1,
        ]),
        ...girths
          .filter((g: IGirth): boolean => g.sweep === sweep)
          .map((g: IGirth): [number, number] => [g.u, g.value]),
      ].sort((a: [number, number], b: [number, number]): number => a[0] - b[0]);
      props.sweepRig(sweep).girth(
        interpolateAutoMovieSpline({
          knots: knots.map((k: [number, number]): number => k[0]),
          values: knots.map((k: [number, number]): number => k[1]),
        }),
      );
    }
    props.rest(props.positions);
    let worst: number = 0;
    girths.forEach((g: IGirth, i: number): void => {
      const measured: number = measure(g);
      worst = Math.max(worst, Math.abs(measured - g.perimeter) / g.perimeter);
      previous[i] = residual[i]!;
      residual[i] = measured - g.perimeter;
    });
    if (worst <= TOLERANCE) return;
    if (iteration === 0)
      girths.forEach((g: IGirth, i: number): void => {
        jacobian[i * n + i] = (residual[i]! + g.perimeter) / g.value;
      });
    else {
      // the rank-one update that makes the Jacobian map the last step onto the last change of the residuals
      let length: number = 0;
      for (let j: number = 0; j < n; ++j) length += step[j]! * step[j]!;
      for (let i: number = 0; i < n; ++i) {
        let miss: number = residual[i]! - previous[i]!;
        for (let j: number = 0; j < n; ++j)
          miss -= jacobian[i * n + j]! * step[j]!;
        for (let j: number = 0; j < n; ++j)
          jacobian[i * n + j]! += (miss * step[j]!) / length;
      }
    }
    solve(jacobian, residual, step, n);
    let scale: number = 1;
    while (
      girths.some(
        (g: IGirth, i: number): boolean => !(g.value - scale * step[i]! > 0),
      )
    )
      scale /= 2;
    girths.forEach((g: IGirth, i: number): void => {
      step[i] = -scale * step[i]!;
      g.value += step[i]!;
    });
  }
  throw new Error(
    `girth rings ${girths.map((g: IGirth): string => g.name).join(", ")} did not converge`,
  );
};

/** Solve the dense system `a x = b` of order `n` by Gaussian elimination with partial pivoting, into `x`; `a` and `b` are left intact. */
const solve = (
  a: Float64Array,
  b: Float64Array,
  x: Float64Array,
  n: number,
): void => {
  const m: Float64Array = a.slice();
  const r: Float64Array = b.slice();
  for (let c: number = 0; c < n; ++c) {
    let pivot: number = c;
    for (let i: number = c + 1; i < n; ++i)
      if (Math.abs(m[i * n + c]!) > Math.abs(m[pivot * n + c]!)) pivot = i;
    if (!(Math.abs(m[pivot * n + c]!) > 0))
      throw new Error("girth rings are not independent");
    if (pivot !== c) {
      for (let j: number = 0; j < n; ++j) {
        const t: number = m[c * n + j]!;
        m[c * n + j] = m[pivot * n + j]!;
        m[pivot * n + j] = t;
      }
      const t: number = r[c]!;
      r[c] = r[pivot]!;
      r[pivot] = t;
    }
    for (let i: number = c + 1; i < n; ++i) {
      const f: number = m[i * n + c]! / m[c * n + c]!;
      for (let j: number = c; j < n; ++j) m[i * n + j]! -= f * m[c * n + j]!;
      r[i]! -= f * r[c]!;
    }
  }
  for (let i: number = n - 1; i >= 0; --i) {
    let s: number = r[i]!;
    for (let j: number = i + 1; j < n; ++j) s -= m[i * n + j]! * x[j]!;
    x[i] = s / m[i * n + i]!;
  }
};
