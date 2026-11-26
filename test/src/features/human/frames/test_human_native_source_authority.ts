import { nclose } from "../../internal/nclose";
import {
  AutoMovieLoftViewFullSource as Full,
  AutoMovieViewAxis,
} from "@automovie/engine";
import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanConicSection as S,
  AutoMovieHumanNativeFamily as Native,
  AutoMovieHumanNativeSourceLaw,
} from "@automovie/human";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSurface,
  IAutoMovieViewAxis,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A complete selected native source survives directional scaling and sampling.
 *
 * Scenarios:
 * 1. An independent square-root circular cap becomes an ellipse with axes 2,3;
 *    its polar formula supplies all six physical jets away from the true pole.
 * 2. Source, part and reflected-name reads retain that same scalar parameter,
 *    cap domain and owned axis, including a name switch after a cached read.
 * 3. Source binding mismatches refuse rather than rebuilding another function.
 * 4. A nonidentity axis-speed bound refines wall and cap intervals and retains
 *    declared course breaks; absent metadata retains the literal old grid.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls NativeFamily.create and actual ConicLoft.source/part/mirror plus the engine full-native reader on made complete sources, collecting every independent scenario.
 * @evidence contracts/development/testing.md#independent-expectations The original radius is sqrt(4-s). An ellipse's polar radius is h/sqrt(cos(t)^2/4+sin(t)^2/9); its closed first/second derivatives supply physical station/phase jets. Sampling bounds use only interval lengths and the supplied speed bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes anisotropy, cap-interior queries, both source names, literal unit-course grid, source-name cache selection, missing source, altered controls/cap bindings and cap-inclusive nonidentity density.
 * @evidence contracts/development/testing.md#execution-ownership Portable synchronous tiny conics only; no Human assembly, private reference, solver, render or process.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes native material addresses, physical jet units, selected source identity and sampling-only rows.
 */
export function test_human_native_source_authority(): void {
  const failures: string[] = [];
  const scenario: (name: string, work: () => void) => void = (
    name: string,
    work: () => void,
  ): void => {
    try {
      work();
    } catch (error: unknown) {
      failures.push(name + ": " + (error instanceof Error ? error.message : String(error)));
    }
  };
  const check: (name: string, value: boolean) => void = (
    name: string,
    value: boolean,
  ): void => { if (!value) failures.push(name); };
  const axis: IAutoMovieViewAxis.IAxis = AutoMovieViewAxis.straight(
    [10, 0, 5], [1, 0, 0], [0, 0, 1],
  );
  const mirrorAxis: IAutoMovieViewAxis.IAxis = AutoMovieViewAxis.straight(
    [10, 0, -5], [1, 0, 0], [0, 0, 1],
  );
  const original: IAutoMovieViewPart = circle("made", axis);
  const mirrorOriginal: IAutoMovieViewPart = circle("made.mirror", mirrorAxis);
  const originals: Map<string, IAutoMovieViewPart> = new Map([
    [original.name!, original], [mirrorOriginal.name!, mirrorOriginal],
  ]);
  const source: IAutoMovieViewPart = AutoMovieHumanNativeSourceLaw.create(original, axis, [2, 3], []);
  const mirror: IAutoMovieViewPart = AutoMovieHumanNativeSourceLaw.create(mirrorOriginal, mirrorAxis, [2, 3], []);
  const sources: Map<string, IAutoMovieViewPart> = new Map([
    ["made", source], ["made.mirror", mirror],
  ]);
  const radii: number[] = [2, Math.SQRT2, 1];
  const prior: IAutoMovieHumanConicLoft.IFamily = {
    name: "made", centres: [[10, 0, 5], [10, 4, 5]], halves: [], up: [1, 0, 0],
    layout: S.limb(0), knots: [0, 2, 3],
    values: [radii, [0, 0, 0], [0, 0, 0], radii, radii.map((x: number): number => -x), [0, 0, 0], [0, 0, 0], radii.map((x: number): number => -x), ...[0, 1, 2, 3].map((): number[] => [Math.SQRT2 - 1, Math.SQRT2 - 1, Math.SQRT2 - 1])],
    tips: [null, { from: 3, tip: 4, rings: 2 }],
  };
  const spec: Native.ISpec = {
    original: prior, bone: prior, originals, axis, scale: (): AutoMovieVector2Tuple => [2, 3],
    station: (s: number): number => s, features: [], protection: [],
    authority: { sources },
  };
  const verify: (label: string, part: IAutoMovieViewPart, z: number) => void = (
    label: string, part: IAutoMovieViewPart, z: number,
  ): void => {
    const reader: IAutoMovieLoftViewFullSource.IReader = Full.create(part);
    for (const s of [0.5, 2.5, 3.5])
      for (const t of [0, 0.37, 1.2, 3.7]) {
        const actual: IAutoMovieSolidSurface.IJet = reader.jet(s, t);
        const expected: IAutoMovieSolidSurface.IJet = ellipse(s, t, z);
        for (const key of ["p", "u", "v", "uu", "uv", "vv"] as const)
          check(label + " " + key + " at " + s + "," + t,
            actual[key].every((value: number, k: number): boolean => nclose(value, expected[key][k]!, 1e-8)));
      }
    check(label + " pole value", reader.point(4, 0).every((x: number, k: number): boolean => x === [10, 4, z][k]));
  };

  scenario("independent source oracle", (): void => {
    verify("original authority", source, 5);
    verify("mirror authority", mirror, -5);
  });
  scenario("complete source/part/mirror authority", (): void => {
    const family: IAutoMovieHumanConicLoft.IFamily = Native.create(spec);
    const read: IAutoMovieViewPart = H.source(family);
    check("source keeps selected scalar", read.front.positive === source.front.positive);
    check("source keeps parameter", read.front.positive.parameter === source.front.positive.parameter);
    check("source keeps selected axis", read.axis === axis);
    verify("source", read, 5);
    const bare: IAutoMovieViewPart = H.source({ ...family, reliefs: undefined, pitch: 0.5, phase: Math.PI / 32 });
    check("bare/density scope retains authority", bare.front.positive === source.front.positive && bare.axis === axis && bare.reliefs === undefined);
    const part: IAutoMovieViewPart = H.part(family, [0, 1, 2, 3]);
    verify("part", part, 5);
    check("unit-course literal grid", part.stations.length === 6 && part.stations.every((s: number, k: number): boolean => Object.is(s, [0, 1, 2, 3, 3.5, 4][k])));
    const twin: IAutoMovieHumanConicLoft.IFamily = H.mirror(family, "made.mirror");
    const reflected: IAutoMovieViewPart = H.source(twin);
    check("mirror owns its selected axis", reflected.axis === mirrorAxis);
    check("mirror owns selected scalar", reflected.front.positive === mirror.front.positive);
    verify("mirror part", H.part(twin, [0, 1, 2, 3]), -5);
    const renamed: IAutoMovieViewPart = H.source({ ...family, name: "made.mirror" });
    check("cache keys selected name/source", renamed.axis === mirrorAxis && renamed.front.positive === mirror.front.positive);
    check("primary cache remains primary", H.source(family).axis === axis);
  });
  scenario("binding refusals", (): void => {
    const family: IAutoMovieHumanConicLoft.IFamily = Native.create(spec);
    for (const changed of [
      { ...family, name: "absent" },
      { ...family, values: family.values.map((row: number[], k: number): number[] => k === 0 ? row.map((x: number): number => x + 1) : row) },
      { ...family, tips: [null, { ...family.tips![1]!, own: true }] as [null, IAutoMovieHumanConicLoft.ITip] },
    ]) {
      let refused: boolean = false;
      try { H.source(changed); } catch { refused = true; }
      check("changed binding was silently rebuilt", refused);
    }
  });
  scenario("cap-inclusive speed sampling", (): void => {
    const family: IAutoMovieHumanConicLoft.IFamily = Native.create({ ...spec, authority: {
      sources, sampling: { maximumSpeed: 4, materialBreaks: [0.5, 3.25] },
    } });
    const part: IAutoMovieViewPart = H.part(family, [0, 1, 2, 3]);
    check("course breaks retained", part.stations.includes(0.5) && part.stations.includes(3.25));
    check("cap rows refined", part.stations.some((s: number): boolean => s > 3.5 && s < 4));
    check("cap interval speed bound", part.stations.every((s: number, k: number): boolean => k === 0 || s - part.stations[k - 1]! <= (s <= 3 ? 0.25 : 0.125)));
    check("sampling retains scalar parameter", part.front.positive === source.front.positive && part.pole === "top");
    verify("sampled authority", part, 5);
  });
  TestValidator.predicate("complete native authority contracts", failures.length === 0 || (() => { throw new Error(failures.join("\n")); })());
}

/** Analytic circular cap, linear in its declared signed square-root parameter. */
function circle(name: string, axis: IAutoMovieViewAxis.IAxis): IAutoMovieViewPart {
  const coordinate: (sign: number) => IAutoMovieViewPart.IOutline = (sign: number): IAutoMovieViewPart.IOutline => ({
    parameter: { type: "root", end: "top", pole: 4 },
    knots: [{ station: 0, value: 2 * sign, site: "base" }, { station: 4, value: 0, site: "pole" }],
  });
  const positive: IAutoMovieViewPart.IOutline = coordinate(1);
  const negative: IAutoMovieViewPart.IOutline = coordinate(-1);
  const shoulder: IAutoMovieViewPart.IOutline = { knots: [{ station: 0, value: Math.SQRT2 - 1, site: "base" }, { station: 4, value: Math.SQRT2 - 1, site: "pole" }] };
  return { name, axis, stations: [0, 2, 3, 3.5, 4], pole: "top", order: 8, samples: 48,
    front: { positive, negative }, side: { positive, negative },
    fullness: { kind: "top", shoulders: [shoulder, shoulder, shoulder, shoulder] } };
}

/** Closed polar ellipse and its station-mm/phase-radian derivatives, with h=sqrt(4-s). */
function ellipse(s: number, t: number, z: number): IAutoMovieSolidSurface.IJet {
  const h: number = Math.sqrt(4 - s), hs: number = -1 / (2 * h), hss: number = -1 / (4 * h ** 3);
  const c: number = Math.cos(t), n: number = Math.sin(t), d: number = 1 / 9 - 1 / 4;
  const k: number = c * c / 4 + n * n / 9, kt: number = 2 * c * n * d, ktt: number = 2 * (c * c - n * n) * d;
  const r: number = 1 / Math.sqrt(k), rt: number = -kt / (2 * k ** 1.5), rtt: number = 3 * kt * kt / (4 * k ** 2.5) - ktt / (2 * k ** 1.5);
  const x: number = r * c, q: number = r * n, xt: number = rt * c - r * n, qt: number = rt * n + r * c;
  return { p: [10 + h * x, s, z + h * q], u: [hs * x, 1, hs * q], v: [h * xt, 0, h * qt],
    uu: [hss * x, 0, hss * q], uv: [hs * xt, 0, hs * qt],
    vv: [h * (rtt * c - 2 * rt * n - r * c), 0, h * (rtt * n + 2 * rt * c - r * n)] };
}
