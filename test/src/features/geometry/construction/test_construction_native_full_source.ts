import type {
  IAutoMovieLoftChain,
  IAutoMovieLoftRelief,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftSurfaceJet,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSurface,
  IAutoMovieViewAxis,
  IAutoMovieViewPart,
} from "@automovie/interface";
import {
  AutoMovieLoftChain,
  AutoMovieLoftJet,
  AutoMovieLoftViewFullSource,
  AutoMovieViewLoft,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** World vector in mm per the requested derivative order. */
type V = [number, number, number];

/**
 * Full original fields include shifted/turning reliefs before a chain or loft.
 *
 * Scenarios:
 * 1. A radius-two cylinder with one 7x7 interior control has the independently
 *    expanded shifted polynomial times a rotating world direction, through total2.
 * 2. Point0 survives absent axis2; physical2 refuses it. Period wrapping, window
 *    boundaries, immutable controls and fresh returned vectors retain meaning.
 * 3. A root-parameter cap has analytic radius 2sqrt(s), a phase-constant pole
 *    value and unavailable regular pole2. A relief that deforms the pole refuses.
 * 4. Outside/nonfinite queries refuse and actual axis callback errors propagate.
 * 5. The actual view-loft counterpart and a same-address relief perturbation
 *    keep the complete original Point0 before and after view-loft publication.
 * 6. A successful raw cap Point0 does not admit an original field overlapping
 *    that cap as an ordinary solid view loft.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public original reader on complete in-memory descriptors and separately compares its Point0/physical2 with actual ViewLoft/LoftChain/LoftJet consumers. Every scenario is collected before one verdict; no process, reference asset or renderer is used.
 * @evidence contracts/development/testing.md#independent-expectations A circle has elementary trigonometric derivatives. On the first cardinal-cubic span the sole central coefficient contributes x^3*y^3/36; expanding its shifted argument gives the explicit monomials below, differentiated algebraically without Relief.height/jet or finite differences. The cap uses radius 2sqrt(s).
 * @evidence contracts/development/testing.md#distinguishing-cases Shift, turning axes, mixed derivatives, empty features, wrapping, value-only capability, retained caps, malformed queries and callback identity distinguish missing composition and invented derivatives.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit discovered as construction_native_full_source; the supervisor owns its one shared RED/GREEN gate.
 * @evidence contracts/development/common.md#meaningful-documentation States fixtures, independent polynomial basis, derivative units and all numbered scenarios.
 */
export function test_construction_native_full_source(): void {
  const failures: string[] = [];
  const check = (
    label: string,
    actual: readonly number[],
    expected: readonly number[],
  ): void => {
    if (
      !actual.every((value: number, k: number): boolean =>
        nclose(value, expected[k]!, 1e-9),
      )
    )
      failures.push(
        label +
          ": " +
          JSON.stringify(actual) +
          " vs " +
          JSON.stringify(expected),
      );
  };
  const refuses = (label: string, read: () => unknown): void => {
    try {
      read();
      failures.push(label + ": accepted an unavailable query");
    } catch {
      /* Expected admission failure. */
    }
  };
  const heights: number[] = new Array<number>(49).fill(0);
  const shift: number[] = new Array<number>(49).fill(0);
  heights[24] = 72;
  shift[24] = 9;
  const feature: IAutoMovieLoftRelief = {
    name: "polynomial",
    stations: [0, 4],
    phases: [0, 4],
    rows: 7,
    columns: 7,
    axis: [0, 1, 0],
    turn: [0, 0, 1],
    heights,
    shift,
  };
  const input: IAutoMovieLoftViewFullSource.IInput = cylinder([feature], true);
  const before: string = JSON.stringify(input);
  const reader: IAutoMovieLoftViewFullSource.IReader =
    AutoMovieLoftViewFullSource.create(input);
  if (reader.regular === null) failures.push("the open direct source lost its regular material span");
  else check("open-source regular endpoints", reader.regular, [0, 4]);
  const s: number = 0.4;
  const t: number = 0.5;
  const expected: IAutoMovieSolidSurface.IJet = polynomial(s, t);
  check("shifted turning Point0", reader.point(s, t), expected.p);
  const actual: IAutoMovieSolidSurface.IJet = reader.jet(s, t);
  for (const key of ["p", "u", "v", "uu", "uv", "vv"] as const)
    check("shifted turning " + key, actual[key], expected[key]);
  check("wrapped point", reader.point(s, t + 2 * Math.PI), expected.p);

  const part: IAutoMovieViewPart = {
    ...input,
    name: "made-full-native",
    order: 32,
    samples: 48,
  };
  const chain: IAutoMovieLoftChain | null =
    AutoMovieViewLoft.create(part).chain;
  if (chain === null) failures.push("actual view-loft counterpart refused");
  else {
    check(
      "existing Point0 consumer",
      AutoMovieLoftChain.point(chain, s, t),
      reader.point(s, t),
    );
    const old: IAutoMovieLoftSurfaceJet = AutoMovieLoftJet.at(chain, s, t);
    const published: IAutoMovieSolidSurface.IJet = {
      p: old.p,
      u: old.s,
      v: old.t,
      uu: old.ss,
      uv: old.st,
      vv: old.tt,
    };
    for (const key of ["p", "u", "v", "uu", "uv", "vv"] as const)
      check("existing physical2 consumer " + key, published[key], actual[key]);
    // Feature heights scale linearly with this single changed ordinate. The
    // original scalar station, phase and feature shift do not move.
    const gain: number = 0.125;
    const perturbed: IAutoMovieViewPart = {
      ...part, reliefs: [{ ...feature, heights: heights.map((value): number => value * (1 + gain)) }],
    };
    const moved = AutoMovieLoftViewFullSource.create(perturbed);
    const baselinePoint = reader.point(s, t), movedPoint = moved.point(s, t);
    const delta: V = [0, (expected.p[1] - s) * gain, (expected.p[2] - 2 * Math.sin(t)) * gain];
    check("original same-address displacement", movedPoint.map((v, k) => v - baselinePoint[k]!), delta);
    const assembled = AutoMovieViewLoft.create(perturbed).chain;
    if (assembled === null) failures.push("same-address perturbed loft refused");
    else {
      const before = AutoMovieLoftChain.point(chain, s, t);
      check("published same-address displacement", AutoMovieLoftChain.point(assembled, s, t)
        .map((v, k) => v - before[k]!), delta);
    }
  }

  const without2: IAutoMovieLoftViewFullSource.IReader =
    AutoMovieLoftViewFullSource.create(cylinder([feature], false));
  check("Point0 without physical2", without2.point(s, t), expected.p);
  refuses("missing axis2", (): unknown => without2.jet(s, t));
  const bare: IAutoMovieLoftViewFullSource.IReader =
    AutoMovieLoftViewFullSource.create(cylinder([], true));
  check("no features", bare.point(s, t), [2 * Math.cos(t), s, 2 * Math.sin(t)]);
  check("window boundary", reader.point(4, t), bare.point(4, t));
  const fresh: V = reader.point(s, t);
  fresh[0] += 99;
  check("fresh output", reader.point(s, t), expected.p);
  if (JSON.stringify(input) !== before)
    failures.push("original controls mutated");

  const capInput: IAutoMovieLoftViewFullSource.IInput = cylinder([], true, true);
  const cap: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(capInput);
  if (cap.regular !== null) failures.push("an entirely capped source supplied a regular interval");
  const local = (xyz: V): [number, number] => [xyz[0], xyz[2]];
  const localJet = (s: number, phase: number) => {
    const j = cap.jet(s, phase);
    return { p: local(j.p), s: local(j.u), t: local(j.v), ss: local(j.uu), st: local(j.uv), tt: local(j.vv) };
  };
  const overlap: IAutoMovieViewPart = {
    ...part, ...capInput,
    originalSection: { name: part.name, domain: [0.5, 1.5], jet: localJet,
      point: (s, phase) => local(cap.point(s, phase)),
      phase: (s, phase) => {
        const { p, t, tt } = localJet(s, phase);
        return { p, t, tt };
      } },
  };
  check("point in a declared cap interval", AutoMovieLoftViewFullSource.create(overlap).point(1, t),
    [2 * Math.cos(t), 1, 2 * Math.sin(t)]);
  const unavailable = AutoMovieViewLoft.create(overlap);
  if (unavailable.chain !== null || !unavailable.diagnostics.some((row) => row.contract === "original section"))
    failures.push("a direct Point0 promoted an original section overlapping a bottom cap to an admitted loft");
  check("collapsed Point0", cap.point(0, t), [0, 0, 0]);
  refuses("collapsed pole2", (): unknown => cap.jet(0, t));
  const capJet: IAutoMovieSolidSurface.IJet = cap.jet(1, t);
  check("cap value", capJet.p, [2 * Math.cos(t), 1, 2 * Math.sin(t)]);
  check("cap station1", capJet.u, [Math.cos(t), 1, Math.sin(t)]);
  check("cap station2", capJet.uu, [-0.5 * Math.cos(t), 0, -0.5 * Math.sin(t)]);
  check("cap mixed", capJet.uv, [-Math.sin(t), 0, Math.cos(t)]);
  const deformed: IAutoMovieLoftViewFullSource.IReader =
    AutoMovieLoftViewFullSource.create(
      cylinder([{ ...feature, stations: [-0.4, 3.6] }], true, true),
    );
  refuses("deformed pole", (): unknown => deformed.point(0, t));
  refuses("below domain", (): unknown => reader.point(-0.01, t));
  refuses("above domain", (): unknown => reader.jet(4.01, t));
  refuses("nonfinite phase", (): unknown => reader.point(s, NaN));

  const sentinel: Error = new Error("actual axis callback");
  const foreign: IAutoMovieLoftViewFullSource.IInput = cylinder([], true);
  const foreignAxis: IAutoMovieViewAxis.IAxis = {
    at: (): IAutoMovieLoftSectionFrame => {
      throw sentinel;
    },
    jet: (): never => {
      throw sentinel;
    },
  };
  const throwing: IAutoMovieLoftViewFullSource.IReader =
    AutoMovieLoftViewFullSource.create({ ...foreign, axis: foreignAxis });
  for (const read of [
    (): unknown => throwing.point(s, t),
    (): unknown => throwing.jet(s, t),
  ]) {
    try {
      read();
      failures.push("actual callback did not throw");
    } catch (error: unknown) {
      if (error !== sentinel)
        failures.push("actual callback error was replaced");
    }
  }
  TestValidator.predicate(
    "full original source: " + failures.join(" | "),
    failures.length === 0,
  );
}

/** Complete direct circle controls; the optional pole selects the documented root parameter. */
function cylinder(
  reliefs: IAutoMovieLoftRelief[],
  physical2: boolean,
  cap: boolean = false,
): IAutoMovieLoftViewFullSource.IInput {
  const zero: IAutoMovieLoftSectionFrame = {
    origin: [0, 0, 0],
    u: [0, 0, 0],
    v: [0, 0, 0],
  };
  const axis: IAutoMovieViewAxis.IAxis = {
    at: (s: number): IAutoMovieLoftSectionFrame => ({
      origin: [0, s, 0],
      u: [1, 0, 0],
      v: [0, 0, 1],
    }),
    ...(physical2
      ? {
          jet: (
            s: number,
          ): {
            value: IAutoMovieLoftSectionFrame;
            first: IAutoMovieLoftSectionFrame;
            second: IAutoMovieLoftSectionFrame;
          } => ({
            value: axis.at(s),
            first: { ...zero, origin: [0, 1, 0] },
            second: zero,
          }),
        }
      : {}),
  };
  const outline = (a: number, b: number): IAutoMovieViewPart.IOutline => ({
    knots: [
      { station: 0, value: a, site: "first" },
      { station: 4, value: b, site: "last" },
    ],
  });
  const radius: IAutoMovieViewPart.IOutline = outline(cap ? 0 : 2, cap ? 4 : 2);
  const negative: IAutoMovieViewPart.IOutline = outline(
    cap ? 0 : -2,
    cap ? -4 : -2,
  );
  const shoulder: IAutoMovieViewPart.IOutline = outline(
    Math.SQRT2 - 1,
    Math.SQRT2 - 1,
  );
  return {
    stations: [0, 4],
    front: { positive: radius, negative },
    side: { positive: radius, negative },
    fullness: {
      kind: "top",
      shoulders: [shoulder, shoulder, shoulder, shoulder],
    },
    axis,
    reliefs,
    ...(cap ? { pole: "bottom" as const } : {}),
  };
}

/** Closed shifted cardinal polynomial times an independently specified rotating direction. */
function polynomial(s: number, t: number): IAutoMovieSolidSurface.IJet {
  const c: number = 9 / 36;
  const terms: readonly (readonly [number, number, number])[] = [
    [2, 3, 3],
    [6 * c, 5, 6],
    [6 * c * c, 7, 9],
    [2 * c * c * c, 9, 12],
  ];
  const derivative = (ds: 0 | 1 | 2, dt: 0 | 1 | 2): number =>
    terms.reduce(
      (sum: number, [a, p, q]: readonly [number, number, number]): number => {
        const sp: number = ds === 0 ? 1 : ds === 1 ? p : p * (p - 1);
        const tp: number = dt === 0 ? 1 : dt === 1 ? q : q * (q - 1);
        return sum + a * sp * tp * s ** (p - ds) * t ** (q - dt);
      },
      0,
    );
  const h: number = derivative(0, 0);
  const hs: number = derivative(1, 0);
  const ht: number = derivative(0, 1);
  const hss: number = derivative(2, 0);
  const hst: number = derivative(1, 1);
  const htt: number = derivative(0, 2);
  const a: number = t - 2;
  const co: number = Math.cos(a);
  const si: number = Math.sin(a);
  return {
    p: [2 * Math.cos(t), s + h * co, 2 * Math.sin(t) + h * si],
    u: [0, 1 + hs * co, hs * si],
    v: [-2 * Math.sin(t), ht * co - h * si, 2 * Math.cos(t) + ht * si + h * co],
    uu: [0, hss * co, hss * si],
    uv: [0, hst * co - hs * si, hst * si + hs * co],
    vv: [
      -2 * Math.cos(t),
      htt * co - 2 * ht * si - h * co,
      -2 * Math.sin(t) + htt * si + 2 * ht * co - h * si,
    ],
  };
}
