import {
  AutoMovieConstructionSplitContinuation as Continuation,
  AutoMovieConstructionSplitFork as Fork,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type { AutoMovieVector3Tuple as V3, IAutoMovieSolidSurface } from "@automovie/interface";

/**
 * The exact continuation carries the native material derivatives at a curved
 * rail between columns. A variable-radius cylinder and its analytic station
 * graph provide an independent 2-jet, with nonzero phase shear.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the analytic 2-jet, phase shear and retained material boundary that the continuation reads.
 * @evidence contracts/development/testing.md#behavioral-verification The reflected chart samples the kept side and matches all six native vectors between columns. The shared fork retains both end jets and smooths the interior clock crease.
 * @evidence contracts/development/testing.md#independent-expectations The analytic cylinder and its station graph give the expected continuation by the chain rule. At the fork, centered differences of positions and first derivatives independently check the reported derivatives.
 * @evidence contracts/development/testing.md#distinguishing-cases The continuation exercises nonzero phase shear and detects a read outside the retained angular range. The fork checks both end jets, its center, the interior, the limit of its support and directed original-side clock addresses on both half-spans.
 * @evidence contracts/development/testing.md#execution-ownership This synchronous unit test runs its own in-memory analytic surfaces from the exported scenario.
 */
export function test_construction_split_continuation(): void {
  const cut = (v: number): [number, number, number] => [2 + Math.cos(v) / 2, -Math.sin(v) / 2, -Math.cos(v) / 2];
  const readPhases: number[] = [];
  const surface: IAutoMovieSolidSurface = {
    name: "analytic child",
    domain: [0, 10],
    orientation: 1,
    period: 2 * Math.PI,
    jet: (u, v): IAutoMovieSolidSurface.IJet => {
      readPhases.push(v);
      if (u < cut(v)[0] || u > 10) throw new Error("The continuation read unowned material");
      const radius: number = 3 + u / 8 + u * u / 32;
      const first: number = 1 / 8 + u / 16;
      const cos: number = Math.cos(v);
      const sin: number = Math.sin(v);
      return {
        p: [u, radius * cos, radius * sin],
        u: [1, first * cos, first * sin],
        v: [0, -radius * sin, radius * cos],
        uu: [0, cos / 16, sin / 16],
        uv: [0, -first * sin, first * cos],
        vv: [0, -radius * cos, -radius * sin],
      };
    },
  };
  const shear: number = 1 / 3;
  const phases: number[] = Array.from({ length: 8 }, (_, k): number => 2 * Math.PI * k / 8);
  const directions: V3[] = phases.map((psi): V3 => {
    const [u, clock]: [number, number, number] = cut(psi);
    const j: IAutoMovieSolidSurface.IJet = surface.jet(u, psi);
    return Vec.combine([[1 + shear * clock, j.u], [shear, j.v]]);
  });
  const travel: number = 1 / 12;
  const made = Continuation.prepare(surface, cut, (clock) => [clock, 1, 0], phases, { into: 1, reach: [1.5, 2.5], directions, angle: travel });
  if (typeof made === "string") throw new Error(made);

  const angle: number = 0.371;
  const [station, diff, bend]: [number, number, number] = cut(angle);
  const source: IAutoMovieSolidSurface.IJet = surface.jet(station, angle);
  const a: number = -(1 + shear * diff);
  const b: number = -shear;
  const expected: IAutoMovieSolidSurface.IJet = {
    p: source.p,
    u: Vec.combine([[a, source.u], [b, source.v]]),
    v: Vec.combine([[diff, source.u], [1, source.v]]),
    uu: Vec.combine([[a * a, source.uu], [2 * a * b, source.uv], [b * b, source.vv], [bend * b * b, source.u]]),
    uv: Vec.combine([[a * diff, source.uu], [a + b * diff, source.uv], [b, source.vv], [bend * b, source.u]]),
    vv: Vec.combine([[diff * diff, source.uu], [2 * diff, source.uv], [1, source.vv], [bend, source.u]]),
  };
  const actual: IAutoMovieSolidSurface.IJet = made(0, angle);
  for (const field of ["p", "u", "v", "uu", "uv", "vv"] as const)
    if (Vec.norm(Vec.sub(actual[field], expected[field])) > 1e-12)
      throw new Error(`The continued ${field} disagrees with the native material`);
  readPhases.length = 0;
  for (const t of [0.125, 0.25, 0.4]) made(t, angle);
  if (readPhases.some((phase): boolean => Math.abs(phase - angle) > travel))
    throw new Error("The reflected read crossed the owned angular range");
  forkClock();
}

/** A shared fork retains both end jets and removes the interior clock crease. */
function forkClock(): void {
  const base = (u: number, c: number): IAutoMovieSolidSurface.IJet => {
    const q: number = u * (1 - u);
    const t: number = 1 - 2 * u;
    return {
      p: [u, c, q * q * Math.abs(c)],
      u: [1, 0, 2 * q * t * Math.abs(c)],
      v: [0, 1, q * q * Math.sign(c)],
      uu: [0, 0, (2 * t * t - 4 * q) * Math.abs(c)],
      uv: [0, 0, 2 * q * t * Math.sign(c)],
      vv: [0, 0, 0],
    };
  };
  const radius: number = 0.45;
  const read = Fork.prepare(base, 1, [{ clock: 0, radius }]);
  const addresses: number[] = [];
  const bounded = Fork.prepare((u, c) => {
    if (Math.abs(c) > radius * (1 + Number.EPSILON))
      throw new Error("The fork read crossed the shared material reach");
    addresses.push(c);
    return base(u, c);
  }, 1, [{ clock: 0, radius }]);
  for (const u of [0.1, 0.25, 0.5, 0.75, 0.9])
    for (const span of [[-24, 0, 0], [0, 24, 1]] as const) {
      let previous: number = -Infinity;
      for (let i: number = span[0]; i <= span[1]; ++i) {
        addresses.length = 0;
        bounded(u, (radius * i) / 25);
        const owned: number = addresses[span[2]]!;
        if (addresses.length !== 2 || !(owned > previous))
          throw new Error(`The fork's original side reverses at (${u}, ${i / 25})`);
        previous = owned;
      }
    }
  const fields = ["p", "u", "v", "uu", "uv", "vv"] as const;
  for (const u of [0, 1])
    for (const c of [-radius / 2, 0, radius / 2])
      for (const field of fields)
        if (Vec.norm(Vec.sub(read(u, c)[field], base(u, c)[field])) !== 0)
          throw new Error(`The fork changed the end ${field}`);
  // At the fork the compact window is C2, so the centred derivative of
  // its first derivative has first-order truncation there.
  const h: number = 8 * Math.sqrt(Number.EPSILON);
  for (const [u, c] of [[0.32, 0], [0.64, 0.2], [0.48, radius]] as const) {
    const measured = read(u, c);
    const derivative = (a: V3, b: V3): V3 => Vec.scale(Vec.sub(a, b), 1 / (2 * h));
    const [left, right] = [read(u, c - h), read(u, c + h)];
    const [near, far] = [read(u - h, c), read(u + h, c)];
    if (Math.abs(measured.p[1] - c) > 1e-12) throw new Error("The smoothed chart changed its advancing clock");
    const check = {
      u: derivative(far.p, near.p),
      v: derivative(right.p, left.p),
      uu: derivative(far.u, near.u),
      uv: derivative(right.u, left.u),
      vv: derivative(right.v, left.v),
    };
    for (const field of ["u", "v", "uu", "uv", "vv"] as const)
      if (Vec.norm(Vec.sub(measured[field], check[field])) > 1e-6)
        throw new Error(`The fork ${field} disagrees with the centred derivative at (${u}, ${c})`);
  }
}
