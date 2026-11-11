import {
  AutoMovieConicArc,
  AutoMovieConicArcField,
  AutoMovieConicFieldJet,
  AutoMovieConicHermite,
  AutoMovieLoftSectionNative,
  type AutoMovieLoftViewRead,
  AutoMovieViewConic,
  AutoMovieViewSection,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { ConstructionConicOracle } from "../../internal/construction/ConstructionConicOracle";
import { nclose } from "../../internal/nclose";

/**
 * Native value capabilities retain the original coordinates without unused observations or derivative work.
 *
 * Scenarios:
 * 1. Scaled/reciprocal ellipses and asymmetric G2 sections compare radial/Cartesian values with the existing full readers. Independent implicit ellipse and conic equations check geometry separately from arithmetic compatibility.
 * 2. Explicit rational ellipse cubics with three projectively changed clocks retain independently known points. Active tiny-negative end queries retain their sign and first-order size, while returned arrays remain fresh.
 * 3. A query-owned algebra observes at most four point divisions, allowing fewer, and distinguishes full tangent work. NUMBER and source-Hessian points retain their existing full-kernel arithmetic; the existing conic_field unit owns independent mixed-jet expectations.
 * 4. Invalid source/query values remain NaN radial tuples or explicit point failures, and input getter exceptions preserve identity. A solved circle retains its original public knots/diagonals and measured girth.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls production radial/Point0 factories, raw/G2 point kernels and public solve, observing their returned values, failures, fresh vectors and query-local work rather than replacing globals or reading source text.
 * @evidence contracts/development/testing.md#independent-expectations Ellipse radius is the independent implicit oracle; general conics satisfy (X+Y-1)^2=4w^2(1-X)(1-Y). A degree-elevated ellipse has explicit controls/weights and weight_i*k^i changes only its clock. Circle length is 2*pi*R. Object.is comparisons separately pin unchanged arithmetic/signed zero and are not independent geometric proofs. Point division allowance follows two normalized extents and two coordinate quotients; fewer operations remain allowed.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes three scales, reciprocal aspects, asymmetric active ends, guide/end/interior angles, tiny negative phase, projective clocks 1e-100/1/1e100, invalid values/getters and fresh-result mutation. A full evaluator hidden behind Point0 exceeds the division allowance.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU question through --include construction_source_value_cost; no Human generation, host, timer, viewer or GPU is started.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Scaled/reciprocal ellipses and asymmetric G2 sections compare radial/Cartesian values with the existing full readers. Independent implicit...).
 */
export function test_construction_source_value_cost(): void {
  const failures: string[] = [];
  const E: number = Math.SQRT2 - 1;
  const cases: AutoMovieLoftViewRead.IValues[] = [];
  for (const scale of [0.001, 1, 1000])
    for (const [a, b] of [
      [3, 2],
      [2, 3],
    ])
      cases.push({
        extents: [a! * scale, b! * scale, a! * scale, b! * scale],
        shoulders: [E, E, E, E],
      });
  cases.push(
    { extents: [3, 2, 4, 1], shoulders: [E, E, E, E] },
    { extents: [2, 4, 3, 1], shoulders: [0.25, 0.45, 0.6, 0.35] },
  );
  for (const inputs of cases) {
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.bare(
      { extents: inputs.extents as [number, number, number, number] },
      inputs.shoulders as [number, number, number, number],
    );
    const radial: ReturnType<typeof AutoMovieLoftSectionNative.radial> =
      AutoMovieLoftSectionNative.radial(inputs);
    const value: ReturnType<typeof AutoMovieLoftSectionNative.value> =
      AutoMovieLoftSectionNative.value(inputs);
    const point: ReturnType<typeof AutoMovieLoftSectionNative.point> =
      AutoMovieLoftSectionNative.point(inputs);
    const phase: ReturnType<typeof AutoMovieLoftSectionNative.phase> =
      AutoMovieLoftSectionNative.phase(inputs);
    const shared: AutoMovieLoftSectionNative.ICurve =
      AutoMovieLoftSectionNative.curve(inputs);
    const angles: number[] = [
      0,
      -0,
      0.37,
      Math.PI / 2,
      Math.PI,
      (3 * Math.PI) / 2,
      2 * Math.PI,
      -0.37,
      -1e-20,
    ];
    for (const [q, arc] of section.conics.quarters.entries()) {
      if (arc.start !== null)
        angles.push((q * Math.PI) / 2 + arc.start.angle / 4);
      if (arc.end !== null)
        angles.push(((q + 1) * Math.PI) / 2 - arc.end.angle / 4);
    }
    for (const phi of angles) {
      const expectedRadial: ReturnType<typeof radial> =
        AutoMovieViewSection.radius(section, phi);
      const actualRadial: ReturnType<typeof radial> = radial(phi);
      const expectedPoint: [number, number] = phase(phi).p;
      const actualPoint: [number, number] = shared.point(phi);
      const sharedPhase: ReturnType<typeof phase> = shared.phase(phi);
      const originalPhase: ReturnType<typeof phase> = phase(phi);
      if (
        !Object.is(value(phi), expectedRadial[0]) ||
        !actualRadial.every((value: number, i: number): boolean =>
          Object.is(value, expectedRadial[i]),
        ) ||
        !point(phi).every((value: number, i: number): boolean =>
          Object.is(value, actualPoint[i]),
        ) ||
        !(["p", "t", "tt"] as const).every((key: "p" | "t" | "tt"): boolean =>
          sharedPhase[key].every((value: number, i: number): boolean =>
            Object.is(value, originalPhase[key][i]),
          ),
        ) ||
        !actualPoint.every((value: number, i: number): boolean =>
          Object.is(value, expectedPoint[i]),
        )
      )
        failures.push(`native value arithmetic ${inputs.extents}/${phi}`);
      if (
        inputs.extents[0] === inputs.extents[2] &&
        inputs.extents[1] === inputs.extents[3]
      ) {
        const rho: number = ConstructionConicOracle.ellipse(
          inputs.extents[0]!,
          inputs.extents[1]!,
          phi,
        )[0];
        const scale: number = Math.max(...inputs.extents);
        if (
          !nclose(value(phi), rho, 2e-9 * scale) ||
          !nclose(actualPoint[0], rho * Math.cos(phi), 2e-9 * scale) ||
          !nclose(actualPoint[1], rho * Math.sin(phi), 2e-9 * scale)
        )
          failures.push(`independent ellipse point ${inputs.extents}/${phi}`);
      }
    }
    const prior: [number, number] = point(0.37);
    const original: number = prior[0];
    prior[0] += 10;
    if (!Object.is(point(0.37)[0], original))
      failures.push("native value result aliases retained geometry");
  }

  // The active reflected G2 end preserves the small negative distance even
  // when pi/2 minus that distance rounds to the main guide.
  const tiny: [number, number] = AutoMovieLoftSectionNative.point({
    extents: [3, 2, 4, 1],
    shoulders: [E, E, E, E],
  })(-1e-20);
  if (!(tiny[1] < 0 && nclose(tiny[1] / -3e-20, 1, 1e-8)))
    failures.push(`tiny negative value was lost: ${tiny}`);
  rawAndWork(failures);
  projective(failures);

  for (const inputs of [
    { extents: [0, 1, 1, 1], shoulders: [E, E, E, E] },
    { extents: [1, 1, 1, 1], shoulders: [0, E, E, E] },
  ]) {
    if (!AutoMovieLoftSectionNative.radial(inputs)(0.3).every(Number.isNaN))
      failures.push("invalid source has a radial value fallback");
    for (const phi of [0, Math.PI / 2, Math.PI, -0.3])
      if (!Number.isNaN(AutoMovieLoftSectionNative.value(inputs)(phi)))
        failures.push("invalid source has a scalar fallback at " + phi);
    let rejected: boolean = false;
    try {
      AutoMovieLoftSectionNative.point(inputs);
    } catch {
      rejected = true;
    }
    if (!rejected) failures.push("invalid source has a point fallback");
  }
  const valid: AutoMovieLoftViewRead.IValues = {
    extents: [3, 2, 3, 2],
    shoulders: [E, E, E, E],
  };
  for (const phi of [NaN, Infinity, -Infinity]) {
    if (!AutoMovieLoftSectionNative.radial(valid)(phi).every(Number.isNaN))
      failures.push("nonfinite query has a radial fallback");
    if (!Number.isNaN(AutoMovieLoftSectionNative.value(valid)(phi)))
      failures.push("nonfinite query has a scalar fallback");
    let rejected: boolean = false;
    try {
      AutoMovieLoftSectionNative.point(valid)(phi);
    } catch {
      rejected = true;
    }
    if (!rejected) failures.push("nonfinite query has a point fallback");
  }
  const marker: Error = new Error("made-input-getter");
  const broken: AutoMovieLoftViewRead.IValues = {
    /** An input exception is not numeric admission. */
    get extents(): number[] {
      throw marker;
    },
    shoulders: [E, E, E, E],
  };
  for (const factory of [
    AutoMovieLoftSectionNative.radial,
    AutoMovieLoftSectionNative.value,
    AutoMovieLoftSectionNative.point,
  ]) {
    let retained: boolean = false;
    try {
      factory(broken);
    } catch (error) {
      retained = error === marker;
    }
    if (!retained) failures.push("input getter exception identity changed");
  }
  for (const extent of [0, -1, Infinity, NaN]) {
    if (!Number.isNaN(AutoMovieConicArc.value(extent, 2, E, 0)))
      failures.push("invalid guide extent has a scalar fallback");
    const source: AutoMovieViewConic.ICurve = AutoMovieViewSection.bare(
      { extents: [3, 2, 3, 2] },
      [E, E, E, E],
    ).conics;
    const invalid: AutoMovieViewConic.ICurve = {
      ...source,
      quarters: source.quarters.map(
        (
          quarter: AutoMovieViewConic.IQuarter,
          i: number,
        ): AutoMovieViewConic.IQuarter =>
          i === 0
            ? { ...quarter, extents: [extent, quarter.extents[1]] }
            : quarter,
      ),
    };
    if (!Number.isNaN(AutoMovieViewConic.value(invalid, 0)))
      failures.push("invalid cardinal value has a scalar fallback");
  }

  const solved: AutoMovieViewSection.ISolved = AutoMovieViewSection.solve(
    "value-cost circle",
    { extents: [10, 10, 10, 10] },
    20 * Math.PI,
  );
  if (solved.section === null || solved.diagnostics.length !== 0)
    failures.push("circle solve lost its measured public section");
  else if (
    !(
      solved.section.knots.length > 4 &&
      solved.section.diagonals.every((value: number): boolean =>
        nclose(value, 10, 1e-6),
      ) &&
      nclose(solved.section.girth, 20 * Math.PI, 1e-6)
    )
  )
    failures.push(
      "selected public section lost observations or circle measures",
    );
  TestValidator.predicate(
    `${failures.length} source value/cost findings:\n${failures.join("\n")}`,
    (): boolean => failures.length === 0,
  );
}

/** Independent raw implicit/ray checks and a bounded query-owned operation observer. */
function rawAndWork(failures: string[]): void {
  for (const r of [0.05, Math.SQRT2 - 1, 0.9])
    for (const phi of [0.01, 0.37, 1.4]) {
      const p: readonly [number, number] | null = AutoMovieConicArc.point(
        3,
        2,
        r,
        phi,
      );
      const full: AutoMovieConicArc.IRay | null = AutoMovieConicArc.locate(
        3,
        2,
        r,
        phi,
      );
      if (p === null || full === null) {
        failures.push("raw point not available");
        continue;
      }
      const X: number = p[0] / 3;
      const Y: number = p[1] / 2;
      const w: number = r / (1 - r);
      if (
        !nclose((X + Y - 1) ** 2, 4 * w * w * (1 - X) * (1 - Y), 2e-12) ||
        !nclose(Math.atan2(p[1], p[0]), phi, 2e-12)
      )
        failures.push(`raw implicit/ray ${r}/${phi}`);
      if (
        !p.every((value: number, i: number): boolean =>
          Object.is(value, full.point[i]),
        )
      )
        failures.push("raw physical point arithmetic changed");
    }
  const counter: { divisions: number } = { divisions: 0 };
  const ops: AutoMovieConicFieldJet.IAlgebra<number> = {
    ...AutoMovieConicFieldJet.NUMBER,
    /** Count this query's divisions without replacing the production table. */
    divide(left: number, right: number): number {
      counter.divisions++;
      return left / right;
    },
  };
  AutoMovieConicArcField.point(ops, 3, 2, Math.SQRT1_2, 0.37);
  const pointDivisions: number = counter.divisions;
  counter.divisions = 0;
  AutoMovieConicArcField.evaluate(ops, 3, 2, Math.SQRT1_2, 0.37);
  if (!(pointDivisions <= 4 && counter.divisions > pointDivisions))
    failures.push(`point work ${pointDivisions}/${counter.divisions}`);
  const AD: AutoMovieConicFieldJet.IAlgebra<AutoMovieConicFieldJet.IJet> =
    AutoMovieConicFieldJet.AD;
  const a: AutoMovieConicFieldJet.IJet = [3, 2, 1, 1, 2, 3];
  const b: AutoMovieConicFieldJet.IJet = [2, 1, -1, 2, 0, 1];
  const w: AutoMovieConicFieldJet.IJet = AD.constant(Math.SQRT1_2);
  const t: AutoMovieConicFieldJet.IJet = AD.constant(0.37);
  const point: readonly [
    AutoMovieConicFieldJet.IJet,
    AutoMovieConicFieldJet.IJet,
  ] = AutoMovieConicArcField.point(AD, a, b, w, t);
  const full: AutoMovieConicArcField.IGeometry<AutoMovieConicFieldJet.IJet> =
    AutoMovieConicArcField.evaluate(AD, a, b, w, t);
  if (
    !point.every((row: AutoMovieConicFieldJet.IJet, c: number): boolean =>
      row.every((value: number, i: number): boolean =>
        Object.is(value, full.point[c]![i]),
      ),
    )
  )
    failures.push("source-Hessian point arithmetic changed");
  console.log(
    `source value work: point divisions ${pointDivisions}, full divisions ${counter.divisions}`,
  );
}

/** Explicit degree-elevated ellipse controls supply an independent G2 point oracle. */
function projective(failures: string[]): void {
  const w: number = Math.SQRT1_2;
  const u: number = (1 + 2 * w) / 3;
  const q: number = (2 * w) / (1 + 2 * w);
  for (const k of [1e-100, 1, 1e100]) {
    const patch: AutoMovieConicHermite.IPatch = {
      extent: 3,
      deficit: 3,
      height: 2,
      native: 1,
      angle: Math.PI / 2,
      curvature: 0.75,
      points: [
        [0, 0],
        [0, q],
        [1 - q, 1],
        [1, 1],
      ],
      weights: [1, u * k, u * k * k, k ** 3],
    };
    for (const phi of [0, 1e-12, 0.37, 1.4, Math.PI / 2]) {
      const point: readonly [number, number] | null =
        AutoMovieConicHermite.point(patch, phi);
      const rho: number = ConstructionConicOracle.ellipse(3, 2, phi)[0];
      if (
        point === null ||
        !nclose(point[0], rho * Math.cos(phi), 6e-9) ||
        !nclose(point[1], rho * Math.sin(phi), 6e-9)
      )
        failures.push(`projective point ${k}/${phi}`);
    }
  }
}
