import { nclose } from "../../internal/nclose";
import {
  AutoMovieEngineLoftViewFullSource as Full,
  AutoMovieEngineViewAxis,
  AutoMovieEngineViewAxisJet,
} from "@automovie/engine";
import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanConicSection as S,
  AutoMovieHumanNativeFamily as Native,
  AutoMovieHumanNativeProjectionCourse as Course,
} from "@automovie/human";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieConstructionOutlineParameter,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanNativeProjectionCourse,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A physical projection change is one uniform axial scale of the whole part about a declared origin.
 *
 * Scenarios:
 * 1. Ratios .25, .5, .8, 1, 1.25, 2 and 4 (the constraint's declared bracket) about the rail and about an
 *    origin 3 mm behind it: every station's course origin, first and second jet, the moved rail and the
 *    projection follow the closed affine map; identity borrows the original axis.
 * 2. The side profile of a made convex dome read through the real native source keeps exactly the original's
 *    count of inflections at every ratio, and every sampled profile point, cap included, is the original
 *    point moved along the axis by the closed affine displacement.
 * 3. A speed-two source measures physical D, not twice D, and converts the material-pole jet once. A speed
 *    bound that rounds onto an integer (ratio 4 on a speed just under one) stays strict, and the real native
 *    sampler refines the rows with it instead of refusing.
 * 4. Invalid inputs, an unrepresentable scale, unavailable axis2 and a curved source refuse explicitly. A
 *    Point0 call performs no new source2 read.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public course and the real engine FullSource on tiny complete originals. Each case collects its refusal or all numeric findings before one verdict; no whole person, loft, mesh or saved reference is built.
 * @evidence contracts/development/testing.md#independent-expectations A uniform scale x -> c + lambda (x - c) of the material station on a straight constant-frame axis gives origin speed*(c + lambda (s - c)), first jet speed*lambda and zero second jet. Under the root parameter q, ds/dq = 2 sqrt(T - s) and d2s/dq2 = -2. A positive axial affine map multiplies every discrete turn of the side profile by lambda > 0, so the sign pattern and its count of changes are those of the original. None of these uses the implementation's arithmetic; readings use a 1e-10 absolute or 1e-9 relative allowance for binary64 rounding.
 * @evidence contracts/development/testing.md#distinguishing-cases Contraction, expansion, exact identity, a non-rail origin, nonunit speed, a cap, outside-domain and unavailable or malformed counterparts. The previous two-transition speed law fails scenario 2: its varying slope adds profile inflections.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit discovered as human_native_projection_course; it starts no process or renderer.
 * @evidence contracts/development/common.md#meaningful-documentation States physical versus material units, the four scenarios, the closed affine expectations, literal identity and the tolerances.
 */
export function test_human_native_projection_course(): void {
  const failures: string[] = [];
  const close: (label: string, actual: number, expected: number) => void = (label: string, actual: number, expected: number): void => {
    if (!nclose(actual, expected, 1e-10))
      failures.push(label + ": " + actual + " vs " + expected);
  };
  const scenario: (label: string, work: () => void) => void = (label: string, work: () => void): void => {
    try { work(); }
    catch (error: unknown) {
      failures.push(label + ": " + (error instanceof Error ? error.message : String(error)));
    }
  };
  const refuses: (label: string, work: () => unknown) => void = (label: string, work: () => unknown): void => {
    try { work(); failures.push(label + ": unsupported input accepted"); }
    catch (error: unknown) {
      if (String(error).includes("not implemented"))
        failures.push(label + ": unavailable baseline is not an admission verdict");
    }
  };

  // Each original is an authored analytic input, not a replacement foreign method.
  const straight: (speed: number) => IAutoMovieViewAxis.IAxis = (speed: number): IAutoMovieViewAxis.IAxis => {
    const base: IAutoMovieViewAxis.IAxis = AutoMovieEngineViewAxis.straight(
      [0, 0, 0], [1, 0, 0], [0, 0, 1],
    );
    if (speed === 1) return base;
    return {
      at: (s: number): IAutoMovieLoftSectionFrame => base.at(speed * s),
      jet: (s: number, parameter?: IAutoMovieConstructionOutlineParameter): IAutoMovieViewAxisJet.IJet | null => AutoMovieEngineViewAxisJet.parameter(
        AutoMovieEngineViewAxisJet.fixed(base.at(speed * s), [0, speed, 0], [0, 0, 0]),
        parameter, s,
      ),
    };
  };
  const run: (lambda: number, speed: number, rail: number, length: number, behind: number) => void = (
    lambda: number, speed: number, rail: number, length: number, behind: number,
  ): void => {
    const original: IAutoMovieViewAxis.IAxis = straight(speed);
    const projection: number = lambda * (speed * length);
    const tip: number = rail + length;
    const origin: number = rail - behind;
    const nativeOriginal: IAutoMovieViewPart = cap(original, rail - 1, tip);
    const projectionOwner: IAutoMovieHumanNativeProjectionCourse.IProjectionOwner = Course.prepare(nativeOriginal, rail);
    const made: IAutoMovieHumanNativeProjectionCourse.IPrepared = projectionOwner.project(nativeOriginal, original, projection, origin);
    for (const t of [-0.1, 0, 0.25, 0.5, 0.75, 1]) {
      const s: number = rail + length * t;
      const frame: IAutoMovieLoftSectionFrame = made.axis.at(s);
      close("world origin", frame.origin[1], speed * (origin + lambda * (s - origin)));
      close("fixed chart u", frame.u[0], 1);
      close("fixed chart v", frame.v[2], 1);
      const jet: IAutoMovieViewAxisJet.IJet | null = made.axis.jet?.(s) ?? null;
      if (jet === null) { failures.push("available analytic course2 lost"); continue; }
      close("physical first", jet.first.origin[1], speed * lambda);
      close("physical second", jet.second.origin[1], 0);
      const actualSpeed: number = Math.hypot(...jet.first.origin);
      if (!(actualSpeed > 0 && made.maximumSpeed >= actualSpeed))
        failures.push("positive actual speed exceeds its declared bound");
    }
    if (lambda === 1 && made.axis !== original)
      failures.push("identity replaced the original axis");
    if (made.materialBreaks.length !== 0)
      failures.push("a uniform scale published course breaks");
    close("moved rail", made.axis.at(rail).origin[1], speed * (rail + (lambda - 1) * behind));
    close("physical projection", made.axis.at(tip).origin[1] - made.axis.at(rail).origin[1], projection);
    const middle: number = rail + length / 2;
    const oldParameter: IAutoMovieConstructionOutlineParameter = { type: "root", end: "top", pole: tip };
    const rootJet: IAutoMovieViewAxisJet.IJet | null = made.axis.jet?.(middle, oldParameter) ?? null;
    if (rootJet === null) failures.push("material-pole axis2 lost");
    else {
      close("old-pole first", rootJet.first.origin[1], 2 * speed * lambda * Math.sqrt(length / 2));
      close("old-pole second", rootJet.second.origin[1], -2 * speed * lambda);
    }
    const source: IAutoMovieLoftViewFullSource.IReader = Full.create(cap(made.axis, rail - 1, tip));
    close("material pole Point0", source.point(tip, 0)[1], speed * (origin + lambda * (tip - origin)));
    refuses("outside native source domain", (): unknown => source.point(tip + 1, 0));
  };
  const RATIOS: readonly number[] = [0.25, 0.5, 0.8, 1, 1.25, 2, 4];
  for (const lambda of RATIOS) {
    scenario("lambda " + lambda + " about the rail", (): void => run(lambda, 1, 2, 8, 0));
    scenario("lambda " + lambda + " about a deeper origin", (): void => run(lambda, 1, 2, 8, 3));
  }
  scenario("nonunit physical projection", (): void => run(0.8, 2, 2, 8, 0));
  scenario("nonunit literal identity", (): void => run(1, 2, 2, 8, 0));
  scenario("encoded noninteger span", (): void => run(0.8, 1, 1, 0.2, 0));

  // A course scaled about its pole and carried by a world shift: pole 10 -> 13, rail 2 -> 10 - 1.5 * 8 + 3 = 1.
  scenario("carried course about the pole", (): void => {
    const axis: IAutoMovieViewAxis.IAxis = straight(1);
    const part: IAutoMovieViewPart = cap(axis, 1, 10);
    const owner: IAutoMovieHumanNativeProjectionCourse.IProjectionOwner = Course.prepare(part, 2);
    const made: IAutoMovieHumanNativeProjectionCourse.IPrepared = owner.project(part, axis, 1.5 * owner.projection, 10, [0, 3, 0]);
    close("carried pole", made.axis.at(10).origin[1], 13);
    close("carried rail", made.axis.at(2).origin[1], 1);
    close("carried first jet", made.axis.jet?.(5)?.first.origin[1] ?? NaN, 1.5);
    if (owner.project(part, axis, owner.projection, 10, [0, 0, 0]).axis !== axis)
      failures.push("ratio 1 with no shift replaced the axis");
    if (owner.project(part, axis, owner.projection, 10, [0, 3, 0]).axis.at(10).origin[1] !== 13)
      failures.push("ratio 1 dropped its shift");
    refuses("nonfinite shift", (): unknown => owner.project(part, axis, owner.projection, 10, [0, NaN, 0]));
  });

  // Scenario 2: the side profile of a convex dome under every declared ratio.
  scenario("side profile inflections", (): void => {
    const axis: IAutoMovieViewAxis.IAxis = straight(1);
    const original: IAutoMovieViewPart = dome(axis);
    const owner: IAutoMovieHumanNativeProjectionCourse.IProjectionOwner = Course.prepare(original, 10);
    const stations: number[] = Array.from({ length: 181 }, (_, k: number): number => 9 + (17.9 * k) / 180);
    const profile = (part: IAutoMovieViewPart): [number, number][] => {
      const reader: IAutoMovieLoftViewFullSource.IReader = Full.create(part);
      return stations.map((s: number): [number, number] => {
        const p: readonly number[] = reader.point(s, Math.PI / 2);
        return [p[1]!, Math.hypot(p[0]!, p[2]!)];
      });
    };
    const before: [number, number][] = profile(original);
    const expectedCount: number = inflections(before);
    for (const lambda of RATIOS) {
      const made: IAutoMovieHumanNativeProjectionCourse.IPrepared = owner.project(original, axis, lambda * owner.projection, 7);
      const after: [number, number][] = profile({ ...original, axis: made.axis });
      if (lambda === 1 && made.axis !== axis) failures.push("ratio 1 replaced the original dome axis");
      stations.forEach((s: number, k: number): void => {
        close("affine axial point " + lambda + "@" + s, after[k]![0], before[k]![0] + (lambda - 1) * (s - 7));
        close("unchanged radius " + lambda + "@" + s, after[k]![1], before[k]![1]);
      });
      const count: number = inflections(after);
      if (count !== expectedCount)
        failures.push("ratio " + lambda + " side profile has " + count + " inflections, original " + expectedCount);
    }
  });

  // Scenario 3b: a bound that rounds onto an integer must still let the native sampler cut its rows.
  scenario("integral speed bound through the native sampler", (): void => {
    const speed: number = 1 - Number.EPSILON / 2;
    const axis: IAutoMovieViewAxis.IAxis = straight(speed);
    const original: IAutoMovieViewPart = dome(axis);
    const owner: IAutoMovieHumanNativeProjectionCourse.IProjectionOwner = Course.prepare(original, 10);
    const made: IAutoMovieHumanNativeProjectionCourse.IPrepared = owner.project(original, axis, 4 * owner.projection);
    if (!(made.maximumSpeed >= 4 * speed) || Number.isInteger(made.maximumSpeed))
      failures.push("speed bound " + made.maximumSpeed + " is not a strict noninteger bound");
    const radii: number[] = [Math.sqrt(18), 3, 1];
    const prior: IAutoMovieHumanConicLoft.IFamily = {
      name: original.name!, centres: [axis.at(0).origin, axis.at(27).origin], halves: [],
      up: [1, 0, 0], layout: S.limb(0), knots: [9, 18, 26],
      values: [radii, [0, 0, 0], [0, 0, 0], radii, radii.map((v: number): number => -v), [0, 0, 0],
        [0, 0, 0], radii.map((v: number): number => -v),
        ...[0, 1, 2, 3].map((): number[] => [Math.SQRT2 - 1, Math.SQRT2 - 1, Math.SQRT2 - 1])],
      tips: [null, { from: 26, tip: 27, rings: 2 }],
    };
    const family: IAutoMovieHumanConicLoft.IFamily = Native.create({
      original: prior, bone: prior, originals: new Map([[original.name!, original]]), axis: made.axis,
      scale: (): AutoMovieVector2Tuple => [1, 1], station: (s: number): number => s, features: [], protection: [],
      authority: {
        sources: new Map([[original.name!, { ...original, axis: made.axis }]]),
        sampling: { maximumSpeed: made.maximumSpeed, materialBreaks: made.materialBreaks },
      },
    });
    const rows: number = H.part(family, [9, 10, 18, 26]).stations.length;
    if (!(rows > 6)) failures.push("ratio 4 sampling did not refine its rows: " + rows);
  });

  scenario("Point0 source-read separation", (): void => {
    const base: IAutoMovieViewAxis.IAxis = straight(1);
    let sourceJetReads: number = 0;
    let sourcePoint0Reads: number = 0;
    const original: IAutoMovieViewAxis.IAxis = {
      at: (s: number): IAutoMovieLoftSectionFrame => { sourcePoint0Reads++; return base.at(s); },
      jet: (s: number, p?: IAutoMovieConstructionOutlineParameter): IAutoMovieViewAxisJet.IJet | null => { sourceJetReads++; return base.jet!(s, p); },
    };
    const nativeOriginal: IAutoMovieViewPart = cap(original, 1, 10);
    const projectionOwner: IAutoMovieHumanNativeProjectionCourse.IProjectionOwner = Course.prepare(nativeOriginal, 2);
    const made: IAutoMovieHumanNativeProjectionCourse.IPrepared = projectionOwner.project(nativeOriginal, original, 9.6);
    if (projectionOwner.calibration.axis2ReadAttempts !== sourceJetReads ||
      projectionOwner.calibration.point0ReadAttempts !== sourcePoint0Reads)
      failures.push("original projection read attempts disagree with actual authored-source calls");
    const preparedReads: number = sourceJetReads;
    made.axis.at(5);
    if (sourceJetReads !== preparedReads)
      failures.push("Point0 performed an unnecessary original source2 read");
  });
  const base: IAutoMovieViewAxis.IAxis = straight(1);
  refuses("nonfinite rail", (): unknown => project(base, NaN, 8, 8));
  refuses("zero material span", (): unknown => project(base, 2, 0, 8));
  refuses("negative projection", (): unknown => project(base, 2, 8, -1));
  refuses("collapsed material interval", (): unknown => project(base, Number.MAX_VALUE, 1, 2));
  refuses("underflowed positive scale", (): unknown => project(base, 2, 8, Number.MIN_VALUE));
  refuses("unrepresentable scale", (): unknown => project(base, 2, 0.5, Number.MAX_VALUE));
  refuses("nonfinite origin", (): unknown => Course.prepare(cap(base, 1, 10), 2).project(cap(base, 1, 10), base, 9.6, NaN));
  refuses("unavailable original axis2", (): unknown => project({ at: (s: number): IAutoMovieLoftSectionFrame => base.at(s) }, 2, 8, 9.6));
  const curved: IAutoMovieViewAxis.IAxis = {
    at: (s: number): IAutoMovieLoftSectionFrame => base.at(s + s * s / 16),
    jet: (s: number, p?: IAutoMovieConstructionOutlineParameter): IAutoMovieViewAxisJet.IJet | null => AutoMovieEngineViewAxisJet.parameter(
      AutoMovieEngineViewAxisJet.fixed(base.at(s + s * s / 16), [0, 1 + s / 8, 0], [0, 1 / 8, 0]), p, s,
    ),
  };
  refuses("curved original outside scope", (): unknown => project(curved, 2, 8, 9.6));
  TestValidator.predicate("native projection course: " + failures.join(" | "), failures.length === 0);
}

/** Count sign changes of the discrete turn along a sampled planar profile, ignoring turns at rounding level. */
function inflections(points: readonly [number, number][]): number {
  let previous: number = 0;
  let count: number = 0;
  for (let k: number = 1; k + 1 < points.length; k++) {
    const [a, b, c] = [points[k - 1]!, points[k]!, points[k + 1]!];
    const turn: number = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    const scale: number = Math.hypot(b[0] - a[0], b[1] - a[1]) * Math.hypot(c[0] - b[0], c[1] - b[1]);
    if (!(Math.abs(turn) > 1e-9 * scale)) continue;
    const sign: number = Math.sign(turn);
    if (previous !== 0 && sign !== previous) count++;
    previous = sign;
  }
  return count;
}

/** Tiny positive ellipse with the actual original top material cap. */
function cap(axis: IAutoMovieViewAxis.IAxis, from: number, tip: number): IAutoMovieViewPart {
  const radial: (value: number) => IAutoMovieViewPart.IOutline = (value: number): IAutoMovieViewPart.IOutline => ({
    knots: [{ site: "wall", station: from, value }, { site: "pole", station: tip, value: 0 }],
  });
  const shoulder: IAutoMovieViewPart.IOutline = {
    knots: [
      { site: "wall", station: from, value: Math.SQRT2 - 1 },
      { site: "pole", station: tip, value: Math.SQRT2 - 1 },
    ],
  };
  return {
    name: "made-projection-cap", axis, stations: [from, tip], pole: "top",
    front: { positive: radial(2), negative: radial(-2) },
    side: { positive: radial(3), negative: radial(-3) },
    fullness: { kind: "top", shoulders: [shoulder, shoulder, shoulder, shoulder] },
    order: 8, samples: 8,
  };
}

/** A made convex dome: radius sqrt(27 - s) on stations 9..27, a paraboloid closed at its top pole. */
function dome(axis: IAutoMovieViewAxis.IAxis): IAutoMovieViewPart {
  const coordinate: (sign: number) => IAutoMovieViewPart.IOutline = (sign: number): IAutoMovieViewPart.IOutline => ({
    parameter: { type: "root", end: "top", pole: 27 },
    knots: [{ station: 9, value: sign * Math.sqrt(18), site: "base" }, { station: 27, value: 0, site: "pole" }],
  });
  const shoulder: IAutoMovieViewPart.IOutline = { knots: [
    { station: 9, value: Math.SQRT2 - 1, site: "base" },
    { station: 27, value: Math.SQRT2 - 1, site: "pole" },
  ] };
  return { name: "made-convex-dome", axis, stations: [9, 10, 18, 26, 26.5, 27],
    pole: "top", order: 8, samples: 48,
    front: { positive: coordinate(1), negative: coordinate(-1) },
    side: { positive: coordinate(1), negative: coordinate(-1) },
    fullness: { kind: "top", shoulders: [shoulder, shoulder, shoulder, shoulder] } };
}

/** Malformed and valid tiny sources reach the same prepared production entry. */
function project(axis: IAutoMovieViewAxis.IAxis, rail: number, length: number,
  projection: number): IAutoMovieHumanNativeProjectionCourse.IPrepared {
  const original: IAutoMovieViewPart = cap(axis, rail - 1, rail + length);
  return Course.prepare(original, rail).project(original, axis, projection);
}
