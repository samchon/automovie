import {
  AutoMovieLoftChain,
  AutoMovieLoftJet,
  AutoMovieLoftRelief,
  AutoMovieSplineCurve,
  AutoMovieStationHermite,
  type IAutoMovieLoftChain,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A world vector. */
type V = [number, number, number];
/** A surface jet's six observable fields. */
const KEYS: readonly (keyof AutoMovieLoftJet.IJet)[] = [
  "p",
  "s",
  "t",
  "ss",
  "st",
  "tt",
];

/**
 * Surface jets keep their eager arithmetic while combining only visited spline controls.
 * Independent quadratic surfaces and literal cubic-span weights check geometry; an
 * eager reference checks compatibility for moving frames, lift and reliefs. The
 * reference deliberately shares Hermite/spline primitives and cannot prove those
 * primitives correct. Getter counts check control work, not JavaScript heap bytes.
 *
 * Scenarios:
 * 1. Dense eager compatibility for every derivative, moving frames, lift modes,
 *    relief boundaries and phase/station boundaries, including reversed visits.
 * 2. Independent expanded quadratic geometry and two deliberately broken jets.
 * 3. A collapsed cap, out-of-interval refusal and independently owned outputs.
 * 4. First-support/full-sweep reads, cache hits and ninth-insertion eviction.
 * 5. Duplicate support at small orders and the old malformed-lift fallback.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads every jet field against an independently expanded quadratic surface at the periodic seam, and against the pre-lazy eager composition across nonuniform intervals, moving frames, cubic/quintic/one-sided lift, reliefs, caps and wrapped phases. A deliberate derivative error must fail the independent reader.
 * @evidence contracts/development/testing.md#independent-expectations Independent polynomial derivatives and literal span weights verify geometry without the production interpolation readers; the separately labelled eager oracle verifies arithmetic compatibility using those readers. Each reader rejects a derivative moved by 0.01. Eager compatibility uses exact equality; analytic checks use 1e-9 for floating polynomial interpolation. Counting accessors observe input reads without inspecting private cache layout.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers normal N-control fast paths, duplicate support at N=1/2/3, first/full/repeated/reversed phase visits, wrapping, eight nonpromoting insertion slots and eviction, clone identity, poles, interval tolerance/refusal and fresh vectors. Short lift and absent basis cases only preserve old eager behavior, not valid-loft admission. The existing view-section-chain test owns fitting and C2 continuity of generated view chains. Does not measure current f1 performance.
 * @evidence contracts/development/testing.md#execution-ownership This discoverable test function owns its synchronous portable synthetic cases. It starts no Human generation, process, browser or GPU and imposes no host time or heap limit.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Dense eager compatibility for every derivative, moving frames, lift modes,).
 */
export function test_construction_operator_loft_jet(): void {
  const failures: string[] = [];
  for (const mode of [0, 1, 2, 3]) {
    const chain: IAutoMovieLoftChain = made(16, mode, true);
    for (const s of [0, -5e-10, 1e-10, 1.3, 2, 3.2, 7, 7 + 5e-10])
      for (const t of [
        0,
        -2 * Math.PI,
        2 * Math.PI,
        -1,
        4,
        -0.3,
        Math.PI / 8 - 1e-12,
        Math.PI / 8,
        Math.PI / 8 + 1e-12,
        3.7,
        100 * Math.PI,
      ])
        same(
          AutoMovieLoftJet.at(chain, s, t),
          eager(chain, s, t),
          0,
          `mode ${mode}, ${s}/${t}`,
          failures,
        );
    for (let j: number = 32; j >= 0; j--)
      same(
        AutoMovieLoftJet.at(chain, 3.2, (j * Math.PI) / 16),
        eager(chain, 3.2, (j * Math.PI) / 16),
        0,
        "reverse sweep",
        failures,
      );
    const returned: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(
      chain,
      1.3,
      0.2,
    );
    for (const key of KEYS) returned[key].fill(123456);
    same(
      AutoMovieLoftJet.at(chain, 1.3, 0.2),
      eager(chain, 1.3, 0.2),
      0,
      "returned vector ownership",
      failures,
    );
    const clone: IAutoMovieLoftChain = structuredClone(chain);
    clone.layers[0]!.coefficients[0]! += 5;
    same(
      AutoMovieLoftJet.at(clone, 0, 0),
      eager(clone, 0, 0),
      0,
      "clone identity",
      failures,
    );
  }
  const legacy: IAutoMovieLoftChain = made(8, 2, true);
  delete legacy.basis;
  same(
    AutoMovieLoftJet.at(legacy, 1.5, -0.2),
    eager(legacy, 1.5, -0.2),
    0,
    "unchanged absent-basis path",
    failures,
  );
  for (const n of [1, 2, 3, 4]) {
    const small: IAutoMovieLoftChain = made(n, 2, true);
    for (const t of [0, -0.3, Math.PI, 2 * Math.PI])
      same(
        AutoMovieLoftJet.at(small, 1, t),
        eager(small, 1, t),
        0,
        `duplicate support N=${n}`,
        failures,
      );
  }
  const malformed: IAutoMovieLoftChain = made(8, 2, false);
  malformed.layers[0]!.lift!.length = 5;
  malformed.layers[0]!.liftSlopes!.length = 5;
  malformed.layers[0]!.liftCurvatures!.length = 5;
  for (const t of [0, -0.3, Math.PI])
    same(
      AutoMovieLoftJet.at(malformed, 1, t),
      eager(malformed, 1, t),
      0,
      "old short-lift interpretation",
      failures,
    );

  const analytic: IAutoMovieLoftChain = made(8, 2, false);
  for (const s of [0, 0.5, 2, 4, 7])
    for (const t of [0, -2 * Math.PI, 2 * Math.PI])
      same(
        AutoMovieLoftJet.at(analytic, s, t),
        polynomial(s),
        1e-9,
        "independent polynomial",
        failures,
      );
  const wrong: AutoMovieLoftJet.IJet = polynomial(1);
  wrong.ss[0] += 0.01;
  const proof: string[] = [];
  same(wrong, polynomial(1), 1e-9, "analytic red proof", proof);
  const wrongMixed: AutoMovieLoftJet.IJet = eager(analytic, 1, 0);
  wrongMixed.st[2] += 0.01;
  same(wrongMixed, eager(analytic, 1, 0), 0, "eager red proof", proof);
  if (proof.length !== 2)
    failures.push("a deliberately wrong derivative escaped its reader");

  const cap: IAutoMovieLoftChain = made(8, 0, false);
  cap.pole = { end: "bottom", point: [0, 0, 0] };
  cap.layers[0]!.coefficients.fill(0);
  for (const t of [0, -1, Math.PI, 2 * Math.PI]) {
    const jet: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(cap, 0, t);
    same(jet, eager(cap, 0, t), 0, "collapsed cap", failures);
    if (
      jet.p.some((v: number): boolean => v !== 0) ||
      AutoMovieLoftJet.normal(jet) !== null
    )
      failures.push("collapsed cap lost its axis point or singular normal");
  }
  for (const s of [-2e-9, 7 + 2e-9]) {
    let refused: boolean = false;
    try {
      AutoMovieLoftJet.at(analytic, s, 0);
    } catch {
      refused = true;
    }
    if (!refused) failures.push(`outside station ${s} was not refused`);
  }
  work(failures);
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}

/** Compare all components, explicitly rejecting nonfinite output. */
function same(
  actual: AutoMovieLoftJet.IJet,
  expected: AutoMovieLoftJet.IJet,
  tolerance: number,
  label: string,
  failures: string[],
): void {
  for (const key of KEYS)
    for (let k: number = 0; k < 3; k++) {
      try {
        TestValidator.predicate(
          `${label}: ${key}[${k}]`,
          nclose(actual[key][k]!, expected[key][k]!, tolerance),
        );
      } catch {
        failures.push(
          `${label}: ${key}[${k}] ${actual[key][k]} != ${expected[key][k]}`,
        );
        return;
      }
    }
}

/** Nonuniform layers of quadratic control fields, with optional moving frame and relief. */
function made(n: number, lift: number, moving: boolean): IAutoMovieLoftChain {
  const layers: IAutoMovieLoftChain.ILayer[] = [0, 2, 7].map(
    (s: number): IAutoMovieLoftChain.ILayer => {
      /** The two independent quadratic coefficient fields at a station derivative order. */
      const row: (a: number, b: number) => number[] = (
        a: number,
        b: number,
      ): number[] =>
        Array.from({ length: 2 * n }, (_: unknown, k: number): number =>
          k < n ? a * k : b * (k - n) ** 2,
        );
      const layer: IAutoMovieLoftChain.ILayer = {
        y: s,
        coefficients: row(
          2 + 3 * s + 0.25 * s * s,
          -1 + 0.5 * s + 0.125 * s * s,
        ),
        slopes: row(3 + 0.5 * s, 0.5 + 0.25 * s),
        curvatures: row(0.5, 0.25),
        frame: {
          origin: [0.125 * s * s, s, -0.25 * s * s],
          u: [1, moving ? 0.1 * s : 0, 0],
          v: [0, 0, moving ? 1 + 0.02 * s * s : 1],
        },
        frameSlopes: {
          origin: [0.25 * s, 1, -0.5 * s],
          u: [0, moving ? 0.1 : 0, 0],
          v: [0, 0, moving ? 0.04 * s : 0],
        },
        frameCurvatures: {
          origin: [0.25, 0, -0.5],
          u: [0, 0, 0],
          v: [0, 0, moving ? 0.04 : 0],
        },
      };
      if (lift !== 0 && (lift !== 3 || s !== 0)) {
        layer.lift = new Array<number>(n).fill(0.75 - 2 * s + 0.2 * s * s);
        layer.liftSlopes = new Array<number>(n).fill(-2 + 0.4 * s);
        if (lift === 2 || (lift === 3 && s === 7))
          layer.liftCurvatures = new Array<number>(n).fill(0.4);
      }
      return layer;
    },
  );
  return {
    name: "synthetic jet",
    basis: "spline",
    order: n,
    rule: "polar",
    samples: n,
    layers,
    ...(moving
      ? {
          reliefs: [
            {
              name: "local",
              stations: [0, 7] as [number, number],
              phases: [-1, 4] as [number, number],
              axis: [0.6, 0, 0.8] as V,
              rows: 7,
              columns: 7,
              heights: Array.from(
                { length: 49 },
                (_: unknown, k: number): number => (k === 24 ? 3 : 0),
              ),
            },
          ],
        }
      : {}),
  };
}

/** Expanded quadratic surface at phase zero: literal span weights on indices 7,0,1,2. */
function polynomial(s: number): AutoMovieLoftJet.IJet {
  const x: number = 2 + 3 * s + 0.25 * s * s;
  const z: number = -1 + 0.5 * s + 0.125 * s * s;
  const dx: number = 3 + 0.5 * s;
  const dz: number = 0.5 + 0.25 * s;
  const k: number = 8 / (2 * Math.PI);
  return {
    p: [
      0.125 * s * s + (x * 4) / 3,
      0.75 - s + 0.2 * s * s,
      -0.25 * s * s + (z * 25) / 3,
    ],
    s: [0.25 * s + (dx * 4) / 3, -1 + 0.4 * s, -0.5 * s + (dz * 25) / 3],
    ss: [0.25 + (0.5 * 4) / 3, 0.4, -0.5 + (0.25 * 25) / 3],
    t: [-3 * k * x, 0, -24 * k * z],
    st: [-3 * k * dx, 0, -24 * k * dz],
    tt: [8 * k * k * x, 0, 50 * k * k * z],
  };
}

/** Observe read counts through immutable input accessors, independent of array/cache layout. */
function work(failures: string[]): void {
  const chain: IAutoMovieLoftChain = made(64, 2, false);
  let reads: number = 0;
  for (const values of [chain.layers[0]!.coefficients, chain.layers[0]!.lift!])
    values.forEach((value: number, k: number): void => {
      Object.defineProperty(values, k, {
        get: (): number => {
          reads++;
          return value;
        },
        configurable: true,
      });
    });
  AutoMovieLoftJet.at(chain, 1, 0);
  if (reads !== 36) failures.push(`first support read ${reads}, expected 36`);
  AutoMovieLoftJet.at(chain, 1, 0);
  if (reads !== 36)
    failures.push(`repeated support recombined controls: ${reads}`);
  for (let j: number = 0; j < 64; j++)
    AutoMovieLoftJet.at(chain, 1, (j * 2 * Math.PI) / 64);
  if (reads !== 9 * 64)
    failures.push(`full sweep read ${reads}, expected ${9 * 64}`);
  for (let j: number = 63; j >= 0; j--)
    AutoMovieLoftJet.at(chain, 1, (j * 2 * Math.PI) / 64);
  if (reads !== 9 * 64)
    failures.push(`reverse sweep recombined controls: ${reads}`);
  for (let j: number = 2; j <= 8; j++) AutoMovieLoftJet.at(chain, j / 10, 0);
  const before: number = reads;

  // A hit must not promote the oldest insertion above the ninth station.
  AutoMovieLoftJet.at(chain, 1, 0);
  AutoMovieLoftJet.at(chain, 0.9, 0);
  AutoMovieLoftJet.at(chain, 1, 0);
  if (reads - before !== 72)
    failures.push(`insertion eviction work ${reads - before}, expected 72`);
}

/** Pre-lazy eager composition; a compatibility oracle, not an independent spline/Hermite oracle. */
function eager(
  chain: IAutoMovieLoftChain,
  s: number,
  t: number,
): AutoMovieLoftJet.IJet {
  const [lo, hi] = AutoMovieLoftChain.bracket(chain, s);
  const a: IAutoMovieLoftChain.ILayer = chain.layers[lo]!;
  const b: IAutoMovieLoftChain.ILayer = chain.layers[hi]!;
  const H: number = b.y - a.y;
  const u: number = Math.min(1, Math.max(0, (s - a.y) / H));
  const weights: number[][] = [0, 1, 2].map((order: number): number[] =>
    AutoMovieStationHermite.weights(u, H, order as 0 | 1 | 2, true),
  );
  const q: number[][] = weights.map((w: number[]): number[] =>
    AutoMovieSplineCurve.jet(
      AutoMovieStationHermite.combine(
        { value: a.coefficients, slope: a.slopes, curvature: a.curvatures! },
        { value: b.coefficients, slope: b.slopes, curvature: b.curvatures! },
        w,
      ),
      chain.order,
      t,
    ),
  );
  const f: number[][] = weights.map((w: number[]): number[] =>
    AutoMovieStationHermite.combine(
      AutoMovieStationHermite.frameEnd(a),
      AutoMovieStationHermite.frameEnd(b),
      w,
    ),
  );
  const jet: AutoMovieLoftJet.IJet = {
    p: [0, 0, 0],
    s: [0, 0, 0],
    t: [0, 0, 0],
    ss: [0, 0, 0],
    st: [0, 0, 0],
    tt: [0, 0, 0],
  };
  for (let k: number = 0; k < 3; k++) {
    const u0: number = f[0]![3 + k]!;
    const u1: number = f[1]![3 + k]!;
    const u2: number = f[2]![3 + k]!;
    const v0: number = f[0]![6 + k]!;
    const v1: number = f[1]![6 + k]!;
    const v2: number = f[2]![6 + k]!;
    jet.p[k] = f[0]![k]! + u0 * q[0]![0]! + v0 * q[0]![1]!;
    jet.s[k] =
      f[1]![k]! +
      u0 * q[1]![0]! +
      u1 * q[0]![0]! +
      v0 * q[1]![1]! +
      v1 * q[0]![1]!;
    jet.t[k] = u0 * q[0]![2]! + v0 * q[0]![3]!;
    jet.ss[k] =
      f[2]![k]! +
      u0 * q[2]![0]! +
      2 * u1 * q[1]![0]! +
      u2 * q[0]![0]! +
      v0 * q[2]![1]! +
      2 * v1 * q[1]![1]! +
      v2 * q[0]![1]!;
    jet.st[k] =
      u0 * q[1]![2]! + u1 * q[0]![2]! + v0 * q[1]![3]! + v1 * q[0]![3]!;
    jet.tt[k] = u0 * q[0]![4]! + v0 * q[0]![5]!;
  }
  if (a.lift !== undefined || b.lift !== undefined) {
    const zero: number[] = new Array<number>(chain.order).fill(0);
    const quintic: boolean =
      a.liftCurvatures !== undefined && b.liftCurvatures !== undefined;
    const h: number[][] = [0, 1, 2].map((order: number): number[] => {
      const row: number[] = AutoMovieStationHermite.combine(
        {
          value: a.lift ?? zero,
          slope: a.liftSlopes ?? zero,
          ...(quintic ? { curvature: a.liftCurvatures! } : {}),
        },
        {
          value: b.lift ?? zero,
          slope: b.liftSlopes ?? zero,
          ...(quintic ? { curvature: b.liftCurvatures! } : {}),
        },
        AutoMovieStationHermite.weights(u, H, order as 0 | 1 | 2, quintic),
      );
      return AutoMovieSplineCurve.jet([...row, ...row], chain.order, t);
    });
    const U: V[] = f.map((x: number[]): V => [x[3]!, x[4]!, x[5]!]);
    const W: V[] = f.map((x: number[]): V => [x[6]!, x[7]!, x[8]!]);
    const w: V[] = [
      cross(W[0]!, U[0]!),
      add(cross(W[1]!, U[0]!), cross(W[0]!, U[1]!)),
      add(
        cross(W[2]!, U[0]!),
        scale(cross(W[1]!, U[1]!), 2),
        cross(W[0]!, U[2]!),
      ),
    ];
    jet.p = add(jet.p, scale(w[0]!, h[0]![0]!));
    jet.s = add(jet.s, scale(w[0]!, h[1]![0]!), scale(w[1]!, h[0]![0]!));
    jet.t = add(jet.t, scale(w[0]!, h[0]![2]!));
    jet.ss = add(
      jet.ss,
      scale(w[0]!, h[2]![0]!),
      scale(w[1]!, 2 * h[1]![0]!),
      scale(w[2]!, h[0]![0]!),
    );
    jet.st = add(jet.st, scale(w[0]!, h[1]![2]!), scale(w[1]!, h[0]![2]!));
    jet.tt = add(jet.tt, scale(w[0]!, h[0]![4]!));
  }
  for (const relief of chain.reliefs ?? []) {
    const h: number[] = AutoMovieLoftRelief.jet(relief, s, t);
    if (h.every((x: number): boolean => x === 0)) continue;
    KEYS.forEach((key: keyof AutoMovieLoftJet.IJet, i: number): void => {
      jet[key] = add(jet[key], scale(relief.axis, h[i]!));
    });
  }
  return jet;
}

/** Sum in the same order as the original lift composition. */
function add(...vectors: V[]): V {
  const out: V = [0, 0, 0];
  for (const vector of vectors)
    for (let k: number = 0; k < 3; k++) out[k] += vector[k]!;
  return out;
}

/** Multiply a vector by a scalar. */
function scale(vector: V, factor: number): V {
  return [vector[0] * factor, vector[1] * factor, vector[2] * factor];
}

/** Right-handed vector product. */
function cross(a: V, b: V): V {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
