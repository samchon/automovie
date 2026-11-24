import { nclose } from "../../internal/nclose";
import {
  AutoMovieConstructionPortCurve as PortCurve,
  AutoMovieLoftViewFullSource as Full,
  AutoMovieSolidVector as Vector,
  AutoMovieViewAxis,
} from "@automovie/engine";
import { AutoMovieHumanNativeRootLaw as Root } from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionPortLoop,
  IAutoMovieHumanNativeRoot,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSurface,
  IAutoMovieViewAxis,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** A radius knot and its two physical station derivatives, in mm. */
type RadiusKnot = readonly [number, number, number, number];

/**
 * A negative trial derivative does not make a bracket's regular root invalid.
 *
 * Scenarios:
 * 1. A literal unchanged four-column conic source borrows its original loop.
 * 2. A positive C2 radius has one regular root in (2,3), although the first
 *    trial of the literal [1,4] bracket, 89/80, has negative Gq. Its original
 *    and final Gq are positive; the repaired directed endpoint may be inward.
 * 3. Independent circle point and physical2 identities check the actual full
 *    source before solving and at the issued root, including source membership.
 * 4. Already-solved controls with zero or reversed Gq still refuse; equality of
 *    the level alone cannot certify a regular original-direction boundary.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls public Root.calibrate/prepare/resolve through real FullSource conic descriptors, with no substituted reader, surface callback, person or mesh. All independent scenarios collect failures before one verdict.
 * @evidence contracts/development/testing.md#independent-expectations For the focused column F=(R(q)-1/2)^2 and rho=1/16. The declared cubic has R'=(40/177)(q-21/20)(q-2), R(1)=5/8 and R(4)=13/8, giving first secant trial 89/80 for the literal [1,4] bracket and exactly one regular root in (2,3). Circle total2 and explicit normalized Hermite jets give the source oracle; no observed Human columns supply expectations.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers literal identity, a regular nonmonotone bracket, a negative trial separated from its positive final root, and singular/reversed already-solved final controls. This proves a trial-sign counterexample, not existence or continuation of a root in the six Human refusal cases, full-band validity or a general first-crossing policy.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU source unit discovered as human_native_root_trial_direction. The supervisor owns its combined RED run after the existing test watch; this file starts no process and realizes no geometry.
 * @evidence contracts/development/common.md#meaningful-documentation States all four scenarios, the independent rational construction, mm/radian and physical2 units, aggregate verdict and the explicit limit on actual Human branch conclusions.
 */
export function test_human_native_root_trial_direction(): void {
  const failures: string[] = [];
  const evidence: string[] = [];
  const tolerance: number = 65536 * Number.EPSILON;

  /** Retain every independent failed premise instead of hiding later cases. */
  const check: (label: string, pass: boolean) => void = (
    label: string,
    pass: boolean,
  ): void => {
    if (!pass) failures.push(label);
  };

  /** Allow rounded degree-five and polar source arithmetic, not a geometric fit. */
  const close: (label: string, actual: number, expected: number) => void = (
    label: string,
    actual: number,
    expected: number,
  ): void => check(label + ": " + actual + " vs " + expected,
    nclose(actual, expected, tolerance * Math.max(1, Math.abs(expected))));

  /** Continue independent source and refusal cases after any earlier exception. */
  const scenario: (label: string, run: () => void) => void = (
    label: string,
    run: () => void,
  ): void => {
    try {
      run();
    } catch (error: unknown) {
      failures.push(label + ": " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const parentAxis: IAutoMovieViewAxis.IAxis = AutoMovieViewAxis.horizontal();
  const originalParent: IAutoMovieViewPart = circle("trial-parent", [
    [0, 1 / 4, 1 / 4, 0], [5, 3 / 2, 1 / 4, 0],
  ], parentAxis);
  const child: IAutoMovieViewPart = circle("trial-child", [
    [0, 1, 0, 0], [2, 1, 0, 0],
  ], AutoMovieViewAxis.straight([1 / 2, 0, 0], [1, 0, 0], [0, 0, 1]));
  const loop: IAutoMovieConstructionPortLoop = {
    centre: [0.001, 0], semi: [0.001, 1 / 4], sense: 1,
    shape: [1, 1, 1, 1],
  };
  const original: IAutoMovieHumanNativeRoot.ICalibration = Root.calibrate({
    name: "made-trial-direction", parent: originalParent, child, loop,
    rails: [1], count: 4, correspondence: "angle",
    metric: { station: 0, depth: 2, breadth: 2 }, basis: child.axis.at(0),
  });
  const parent: IAutoMovieViewPart = circle("trial-parent", [
    [0, 1 / 4, 1 / 4, 0],
    [3 / 2, 5 / 8, 1 / 4, 0],
    [2, 5 / 8, 2 / 177, -14 / 59],
    [5, 13 / 8, 4 / 3, 66 / 59],
  ], parentAxis);
  const reader: IAutoMovieLoftViewFullSource.IReader = Full.create(parent);

  /** Exercise Level through its production public Root consumer and real calibration. */
  const solve: (source: IAutoMovieViewPart) => IAutoMovieHumanNativeRoot.IRootSpec = (
    source: IAutoMovieViewPart,
  ): IAutoMovieHumanNativeRoot.IRootSpec => Root.prepare(original, source, [1, 1]).resolve(child);

  scenario("literal identity", (): void => {
    const full: IAutoMovieLoftViewFullSource.IReader = Full.create(originalParent);
    const same: IAutoMovieHumanNativeRoot.IRootSpec = solve(originalParent);
    check("literal original loop", same.loop === loop);
    same.rows.forEach((row: IAutoMovieHumanNativeRoot.IRootRow, k: number): void => {
      const column: IAutoMovieHumanNativeRoot.IRootRow["level"] = row.level;
      check("literal original share " + k, Object.is(column.share, 1));
      check("identity has no replacement derivative " + k, column.derivative === null);
      const point: AutoMovieVector3Tuple = full.point(...original.charts[k]!);
      point.forEach((value: number, j: number): void =>
        check("literal original point " + k + "/" + j, Object.is(value, original.parent[k]![j])));
    });
  });

  scenario("independent bracket and actual source2", (): void => {
    close("original reference", original.level.levels[0]!, 1 / 16);
    close("original derivative", original.level.derivatives[0]!, 1 / 8);

    // The transition's quintic Bernstein hull stays positive. Its right jets
    // equal the cubic's left jets, so all authored source joins are C2.
    const transition: number[] = [
      5 / 8, 13 / 20, 27 / 40,
      5 / 8 - 2 / 885 - 7 / 2360, 5 / 8 - 1 / 885, 5 / 8,
    ];
    check("positive C2 transition hull", transition.every((value: number): boolean => value > 1 / 2));
    check("cubic maximum before its dip remains below root", radius(21 / 20)[0] < 3 / 4);
    check("cubic minimum excludes opposite radius root", radius(2)[0] > 1 / 2);
    check("one increasing positive root lies in (2,3)", radius(2)[0] < 3 / 4 && radius(3)[0] > 3 / 4);
    close("initial level residual", (5 / 8 - 1 / 2) ** 2 - 1 / 16, -3 / 64);
    close("edge level residual", (13 / 8 - 1 / 2) ** 2 - 1 / 16, 77 / 64);
    const trial: number = (1 * (77 / 64) - 4 * (-3 / 64)) / ((77 + 3) / 64);
    close("literal [1,4] bracket first Illinois trial", trial, 89 / 80);
    const [r, first]: readonly [number, number, number] = radius(trial);
    check("trial derivative is strictly negative", 2 * (r - 1 / 2) * first < 0);
    close("trial radius derivative", first, -71 / 5664);
    for (const q of [1, trial, 2, 3, 4]) physical(reader, q, close, check);
    evidence.push("literalBracketTrial=" + trial + ", trialGq=" + 2 * (r - 1 / 2) * first + ", uniqueRoot=(2,3)");
  });

  scenario("regular final root survives a negative trial", (): void => {
    const result: IAutoMovieHumanNativeRoot.IRootSpec = solve(parent);
    const column: IAutoMovieHumanNativeRoot.IRootRow["level"] = result.rows[0]!.level;
    check("final root in independently isolated interval", column.share > 2 && column.share < 3);
    check("final original direction", column.derivative !== null && column.derivative > 0);
    const high: number = column.bracket?.[1] ?? NaN;
    check("nonmaximal admitted source-domain bracket", column.bracket !== null && column.bracket[0] === 1 && high > 3 && high <= 4);

    // Directed arithmetic promises a safe inner endpoint, not literal 4.
    // Read that endpoint through the actual chart owner and strict source.
    const boundary: IAutoMovieConstructionPortLoop = {
      ...result.loop, shape: [high, ...result.loop.shape!.slice(1)],
    };
    const address: [number, number] = PortCurve.chart(boundary, 4).addresses[0]!;
    const inside: boolean = Number.isFinite(address[0]) && Number.isFinite(address[1]) &&
      address[0] >= reader.domain[0] && address[0] <= reader.domain[1] &&
      address[1] >= -Math.PI / 2 && address[1] <= Math.PI / 2;
    check("canonical Q address stays in unchanged source/phase domain", inside);
    if (inside)
      check("strict source admits canonical Q address", reader.point(...address).every(Number.isFinite));
    physical(reader, column.share, close, check);
    close("root equation R=3/4", radius(column.share)[0], 3 / 4);
    result.rows.forEach((rootRow: IAutoMovieHumanNativeRoot.IRootRow, k: number): void => {
      const row: IAutoMovieHumanNativeRoot.IRootRow["level"] = rootRow.level;
      const c: number = 2 * Math.PI * k / 4;
      const point: AutoMovieVector3Tuple = reader.point(
        1 + row.share * Math.cos(c), row.share * (1 / 4) * Math.sin(c),
      );
      const actual: number = (point[0] - 1 / 2) ** 2 + point[2] ** 2;
      const budget: number = 512 * Number.EPSILON * Math.max(1, Math.abs(row.reference), Math.abs(actual));
      check("literal current-source membership " + k, Math.abs(actual - row.reference) <= budget);
      close("level records actual source " + k, row.actual, actual);
      if (k > 0) check("untouched other radial control " + k, Object.is(row.share, 1));
    });
    evidence.push("root=" + column.share + ", finalGq=" + column.derivative + ", signed=" + column.signed);
  });

  // Each counterpart already meets rho at q0. Another column differs from the
  // original source, so neither can enter the whole-control identity shortcut.
  for (const kind of ["singular", "reversed"] as const) {
    scenario("already-solved " + kind + " final control refuses", (): void => {
      const knots: RadiusKnot[] = kind === "singular"
        ? [[0, 3 / 4, 0, 0], [5, 3 / 4, 0, 0]]
        : [[0, 17 / 20, -1 / 20, 0], [5, 3 / 5, -1 / 20, 0]];
      const source: IAutoMovieViewPart = circle("trial-parent", knots, parentAxis);
      const full: IAutoMovieLoftViewFullSource.IReader = Full.create(source);
      const point: AutoMovieVector3Tuple = full.point(2, 0);
      const jet: IAutoMovieSolidSurface.IJet = full.jet(2, 0);
      close(kind + " already solves the level", (point[0] - 1 / 2) ** 2 + point[2] ** 2, 1 / 16);
      check(kind + " surface remains regular", Vector.norm(Vector.cross(jet.u, jet.v)) > 0);
      const g: number = 2 * (point[0] - 1 / 2) * jet.u[0];
      if (kind === "singular") close("singular Gq", g, 0);
      else check("reversed Gq", g < 0);
      let reason: string | null = null;
      try {
        solve(source);
      } catch (error: unknown) {
        reason = error instanceof Error ? error.message : String(error);
      }
      check(kind + " final orientation refusal", reason !== null && reason.includes("original derivative direction"));
      evidence.push(kind + ": Gq=" + g + ", refusal=" + reason);
    });
  }

  TestValidator.predicate("native root trial direction\n" + failures.join("\n") + "\n" + evidence.join("\n"),
    failures.length === 0,
  );
}

/**
 * Focus-column radius on q in [1,4]. Its two critical points are 21/20 and 2;
 * between 2 and 4 it increases from below 3/4 to above 3/4 exactly once.
 */
function radius(q: number): readonly [number, number, number] {
  return [
    5 / 8 + (40 / 177) * ((q ** 3 - 1) / 3 - (61 / 40) * (q ** 2 - 1) + (21 / 10) * (q - 1)),
    (40 / 177) * (q - 21 / 20) * (q - 2),
    (40 / 177) * (2 * q - 61 / 20),
  ];
}

/** Check total2 of S(s,t)=(R(s-1) cos(t),s,R(s-1) sin(t)) at t=0. */
function physical(
  reader: IAutoMovieLoftViewFullSource.IReader,
  q: number,
  close: (label: string, actual: number, expected: number) => void,
  check: (label: string, pass: boolean) => void,
): void {
  const [r, first, second]: readonly [number, number, number] = radius(q);
  const point: AutoMovieVector3Tuple = reader.point(q + 1, 0);
  const jet: IAutoMovieSolidSurface.IJet = reader.jet(q + 1, 0);
  const expected: readonly (readonly number[])[] = [
    [r, q + 1, 0], [first, 1, 0], [0, 0, r],
    [second, 0, 0], [0, 0, first], [-r, 0, 0],
  ];
  const rows: AutoMovieVector3Tuple[] = [jet.p, jet.u, jet.v, jet.uu, jet.uv, jet.vv];
  rows.forEach((row: AutoMovieVector3Tuple, i: number): void => row.forEach(
    (value: number, j: number): void => close("source2 q=" + q + "/" + i + "/" + j, value, expected[i]![j]!),
  ));
  point.forEach((value: number, j: number): void => close("Point0 q=" + q + "/" + j, value, expected[0]![j]!));
  check("regular actual conic at q=" + q, Vector.norm(Vector.cross(jet.u, jet.v)) > 0);
}

/**
 * Actual complete circle view source. Authored jets are normalized by the whole
 * station span, while the supplied tuple derivatives are physical per mm.
 */
function circle(
  name: string,
  knots: readonly RadiusKnot[],
  axis: IAutoMovieViewAxis.IAxis,
): IAutoMovieViewPart {
  const span: number = knots.at(-1)![0] - knots[0]![0];

  /** Mirror source coordinates and both jets, retaining the same C2 knots. */
  const outline: (sign: number) => IAutoMovieViewPart.IOutline = (
    sign: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: knots.map(([station, value, first, second]: RadiusKnot, k: number): IAutoMovieViewPart.IKnot => ({
      station, value: sign * value, site: "k" + k,
      jet: { first: sign * first * span, second: sign * second * span * span },
    })),
  });
  const shoulder: IAutoMovieViewPart.IOutline = {
    knots: [knots[0]!, knots.at(-1)!].map((knot: RadiusKnot, k: number): IAutoMovieViewPart.IKnot => ({
      station: knot[0], value: Math.SQRT2 - 1, site: "shoulder" + k,
    })),
  };
  return {
    name, axis, stations: knots.map((knot: RadiusKnot): number => knot[0]),
    order: 8, samples: 8,
    front: { positive: outline(1), negative: outline(-1) },
    side: { positive: outline(1), negative: outline(-1) },
    fullness: { kind: "top", shoulders: [shoulder, shoulder, shoulder, shoulder] },
  };
}
