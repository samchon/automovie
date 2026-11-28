import {
  AutoMovieEngineConicFieldJet,
  AutoMovieEngineViewConic,
  AutoMovieEngineViewOutline,
  AutoMovieEngineViewSectionField,
} from "@automovie/engine";
import type {
  IAutoMovieConicArcField,
  IAutoMovieConicFieldJet,
  IAutoMovieViewConic,
  IAutoMovieViewOutline,
  IAutoMovieViewSectionField,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { ConstructionConicFieldBoundary } from "../../internal/construction/ConstructionConicFieldBoundary";
import { ConstructionConicFieldOracle } from "../../internal/construction/ConstructionConicFieldOracle";

type Scalar = IAutoMovieViewSectionField.IStationJet;
type Prepared = IAutoMovieViewSectionField.IPrepared;
type Radial = readonly [number, number, number, number, number, number];

/**
 * `AutoMovieEngineViewSectionField.prepare` and `read` carry a station's scalar
 * 2-jets (value, first and second derivative along the station) into the radial
 * six-jet `[R, R_s, R_phi, R_ss, R_s phi, R_phi phi]` without reinterpolating
 * them; `AutoMovieEngineConicFieldJet.AD` is the bivariate second-order algebra they
 * run in.
 *
 * Tolerance: a component agrees within `budget * scale + 256 epsilon` of the
 * larger magnitude, the budget 1e-7 unless named.
 *
 * Scenarios:
 *
 * 1. AD on the polynomial jet of (s, p) = (0.3, 0.4): product, sqrt, cbrt and
 *    quotient give the closed square, value, value and value; exp of the linear
 *    jet [0.7, 1, 2, 0, 0, 0] gives e^0.7 [1, 1, 2, 1, 2, 4] and log inverts
 *    it, all within 1e-12.
 * 2. Ellipses of half extents (scale aspect, scale) and reversed, for scales
 *    0.001, 1 and 1000 and aspects 1 to 64, with shoulders sqrt 2 - 1: at
 *    eleven phases from -0.17 to 2 pi + 0.13 the reading equals the implicit
 *    ellipse's six-jet, and its [R, R_phi, R_phi phi] equals the NUMBER
 *    algebra's `AutoMovieEngineViewConic.radius` exactly.
 * 3. Outline sources on one mm, a = scale (1 + s^2) and b = scale (2 + s), read at
 *    s = 0, 0.25, 0.5, 0.75 and 1: their station jets equal the closed
 *    polynomials, their ellipse satisfies scenario 2, and the square of four
 *    equal extents with shoulder 0.3 + 0.05 s reads the square diagonal
 *    identity at the four diagonals.
 * 4. Homothety in an active G2 end: extents (3, 2, 4, 1) times h(s) = 1 + s + s^2
 *    with shoulders (0.2, 0.4, 0.6, 0.3) read [h R, h' R, h R_phi, h'' R, h'
 *    R_phi, h R_phi phi] of the static curve, at s = 0, 0.5 and 1, inside every
 *    active end and at 0.13 and -0.21; at least one end is active.
 * 5. The curvature-owner tie and the moving G2 boundaries
 *    (`ConstructionConicFieldBoundary`) agree with their limits.
 * 6. Structured and JSON copies read the same jet; the geometry reads a ray at
 *    0.37; mutating a returned reading does not change the next; a stale copy
 *    (overwritten quarter extents) and a broken source are refused, the latter
 *    naming its failure; empty and malformed stations are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names scalar jet propagation, ellipse and polynomial checks, active G2 ends, copy behavior and input refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares and reads radial fields at sampled stations and phases, observes all six jet components and exercises altered copies and malformed inputs.
 * @evidence contracts/development/testing.md#independent-expectations Differentiating the implicit ellipse and station polynomials gives independent jets. Homothety scales the radius and angular jets by h, and uses h′ or h″ for the corresponding station derivatives.
 */
export function test_engine_geometry_conic_field(): void {
  const failures: string[] = [];
  const close = (
    actual: readonly number[],
    expected: readonly number[],
    scale: number,
    name: string,
    budget: number = 1e-7,
  ): void => {
    for (let i: number = 0; i < expected.length; i++) {
      const allowance: number =
        budget * scale +
        256 *
          Number.EPSILON *
          Math.max(Math.abs(actual[i]!), Math.abs(expected[i]!));
      if (!(Math.abs(actual[i]! - expected[i]!) <= allowance))
        failures.push(
          `${name}[${i}]: ${actual[i]} against ${expected[i]}, allowance ${allowance}`,
        );
    }
  };
  const prepared = (
    extents: readonly Scalar[],
    shoulders: readonly Scalar[],
  ): Prepared => {
    const value: Prepared | IAutoMovieConicArcField.IFailure =
      AutoMovieEngineViewSectionField.prepare(extents, shoulders);
    if (value.kind === "failure") throw new Error(value.detail);
    return value;
  };
  const radial = (
    at: Prepared,
    phi: number,
  ): IAutoMovieViewSectionField.IRadialJet => {
    const value: IAutoMovieViewSectionField.IRead =
      AutoMovieEngineViewSectionField.read(at, phi);
    if ("kind" in value) throw new Error(value.detail);
    return value;
  };

  // 1.
  const h: ReturnType<typeof ConstructionConicFieldOracle.polynomial> =
    ConstructionConicFieldOracle.polynomial(0.3, 0.4);
  const AD: IAutoMovieConicFieldJet.IAlgebra<IAutoMovieConicFieldJet.IJet> =
    AutoMovieEngineConicFieldJet.AD;
  close(AD.multiply(h.value, h.value), h.square, 1, "product", 1e-12);
  close(AD.sqrt(h.square), h.value, 1, "sqrt", 1e-12);
  close(AD.cbrt(h.cube), h.value, 1, "cbrt", 1e-12);
  close(AD.divide(h.cube, h.square), h.value, 1, "quotient", 1e-12);
  const E: number = Math.exp(0.7);
  const exponential: IAutoMovieConicFieldJet.IJet = [
    E,
    E,
    2 * E,
    E,
    2 * E,
    4 * E,
  ];
  close(AD.exp([0.7, 1, 2, 0, 0, 0]), exponential, 1, "exp", 1e-12);
  close(AD.log(exponential), [0.7, 1, 2, 0, 0, 0], 1, "log", 1e-12);

  // 2.
  const ellipses = (
    a: Scalar,
    b: Scalar,
    name: string,
    scale: number,
  ): void => {
    const r: Scalar = [Math.SQRT2 - 1, 0, 0];
    const at: Prepared = prepared([a, b, a, b], [r, r, r, r]);
    const e: number[] = [a[0], b[0], a[0], b[0]];
    const rs: number[] = [r[0], r[0], r[0], r[0]];
    const numeric: IAutoMovieViewConic.ICurve =
      AutoMovieEngineViewConic.prepareGeometry(
        AutoMovieEngineConicFieldJet.NUMBER,
        e,
        rs,
        AutoMovieEngineViewConic.curvatures(AutoMovieEngineConicFieldJet.NUMBER, e, rs),
      );
    for (const phi of [
      0,
      0.13,
      Math.PI / 4,
      Math.PI / 2,
      Math.PI / 2 + 0.21,
      Math.PI,
      Math.PI + 0.37,
      (3 * Math.PI) / 2,
      -0.17,
      -1e-18,
      2 * Math.PI + 0.13,
    ]) {
      const value: IAutoMovieViewSectionField.IRadialJet = radial(at, phi);
      close(
        value,
        ConstructionConicFieldOracle.ellipse(a, b, phi),
        scale,
        `${name} phi ${phi}`,
      );
      close(
        [value[0], value[2], value[5]],
        AutoMovieEngineViewConic.radius(numeric, phi),
        scale,
        `${name} NUMBER ${phi}`,
        0,
      );
    }
  };
  for (const scale of [0.001, 1, 1000])
    for (const aspect of [1, 2, 4, 8, 16, 32, 64]) {
      const a: Scalar = [scale * aspect, 0, 0];
      const b: Scalar = [scale, 0, 0];
      ellipses(a, b, `ellipse ${scale}/${aspect}`, scale);
      ellipses(b, a, `ellipse ${scale}/${aspect} reversed`, scale);
    }

  // 3.
  const outline = (
    a: number,
    b: number,
    firstA: number,
    firstB: number,
    second: number,
  ): IAutoMovieViewOutline.IOutline => {
    const curve: IAutoMovieViewOutline.IResult = AutoMovieEngineViewOutline.create({
      knots: [
        { site: "start", station: 0, value: a, jet: { first: firstA, second } },
        { site: "end", station: 1, value: b, jet: { first: firstB, second } },
      ],
    });
    if ("detail" in curve) throw new Error(curve.detail);
    return curve;
  };
  const scalar = (
    source: IAutoMovieViewOutline.IOutline,
    s: number,
  ): Scalar => {
    const reading: IAutoMovieViewOutline.IReading | string =
      AutoMovieEngineViewOutline.at(source, s);
    if (typeof reading === "string") throw new Error(reading);
    if (reading.stationJet === null)
      throw new Error(`no station jet: ${reading.stationJetStatus}`);
    return [reading.value, reading.stationJet[0], reading.stationJet[1]];
  };
  for (const scale of [0.001, 1, 1000]) {
    const a: IAutoMovieViewOutline.IOutline = outline(
      scale,
      2 * scale,
      0,
      2 * scale,
      2 * scale,
    );
    const b: IAutoMovieViewOutline.IOutline = outline(
      2 * scale,
      3 * scale,
      scale,
      scale,
      0,
    );
    for (const s of [0, 0.25, 0.5, 0.75, 1]) {
      const aa: Scalar = scalar(a, s);
      const bb: Scalar = scalar(b, s);
      const name: string = `outline ${scale}/${s}`;
      close(aa, [scale * (1 + s * s), 2 * scale * s, 2 * scale], scale, name);
      close(bb, [scale * (2 + s), scale, 0], scale, name);
      ellipses(aa, bb, name, scale);
      const r: Scalar = [0.3 + 0.05 * s, 0.05, 0];
      const square: Prepared = prepared([aa, aa, aa, aa], [r, r, r, r]);
      for (let q: number = 0; q < 4; q++)
        close(
          radial(square, Math.PI / 4 + (q * Math.PI) / 2),
          ConstructionConicFieldOracle.square(aa, r),
          scale,
          `square ${scale}/${s}/${q}`,
        );
    }
  }

  // 4.
  const e: number[] = [3, 2, 4, 1];
  const r: number[] = [0.2, 0.4, 0.6, 0.3];
  const base: IAutoMovieViewConic.ICurve = AutoMovieEngineViewConic.prepareGeometry(
    AutoMovieEngineConicFieldJet.NUMBER,
    e,
    r,
    AutoMovieEngineViewConic.curvatures(AutoMovieEngineConicFieldJet.NUMBER, e, r),
  );
  const phases: number[] = [0.13, -0.21];
  base.quarters.forEach(
    (arc: IAutoMovieViewConic.IQuarter, q: number): void => {
      if (arc.start !== null)
        phases.push((q * Math.PI) / 2 + 0.37 * arc.start.angle);
      if (arc.end !== null)
        phases.push(((q + 1) * Math.PI) / 2 - 0.37 * arc.end.angle);
    },
  );
  TestValidator.predicate("an active G2 end", phases.length > 2);
  for (const s of [0, 0.5, 1]) {
    const k: number = 1 + s + s * s;
    const first: number = 1 + 2 * s;
    const at: Prepared = prepared(
      e.map((v: number): Scalar => [v * k, v * first, 2 * v]),
      r.map((v: number): Scalar => [v, 0, 0]),
    );
    for (const phi of phases) {
      const p: readonly number[] = AutoMovieEngineViewConic.radius(base, phi);
      close(
        radial(at, phi),
        [
          k * p[0]!,
          first * p[0]!,
          k * p[1]!,
          2 * p[0]!,
          first * p[1]!,
          k * p[2]!,
        ],
        1,
        `homothety ${s}/${phi}`,
      );
    }
  }

  // 5.
  ConstructionConicFieldBoundary.tie(close);
  ConstructionConicFieldBoundary.moving(close);

  // 6.
  const shoulder: Scalar = [Math.SQRT2 - 1, 0, 0];
  const ring: Scalar[] = [
    [3, 1, 2],
    [2, 0.5, 0],
    [3, 1, 2],
    [2, 0.5, 0],
  ];
  const at: Prepared = prepared(ring, [shoulder, shoulder, shoulder, shoulder]);
  const expected: Radial = ConstructionConicFieldOracle.ellipse(
    ring[0]!,
    ring[1]!,
    0.37,
  );
  const json: Prepared = JSON.parse(JSON.stringify(at));
  close(radial(structuredClone(at), 0.37), expected, 1, "structured copy");
  close(radial(json, 0.37), expected, 1, "JSON copy");
  TestValidator.predicate(
    "same-geometry ray",
    AutoMovieEngineViewConic.read(at.geometry, 0.37) !== null,
  );
  radial(at, 0.37)[0] = 999;
  close(radial(at, 0.37), expected, 1, "fresh reading");
  const stale: Prepared = structuredClone(at);
  stale.geometry.quarters[0]!.extents = [4, 2];
  TestValidator.predicate(
    "stale copy refused",
    "kind" in AutoMovieEngineViewSectionField.read(stale, 0.37),
  );
  const broken: Prepared = structuredClone(at);
  broken.source.failure = "broken present source";
  const refused: IAutoMovieViewSectionField.IRead =
    AutoMovieEngineViewSectionField.read(broken, 0.37);
  TestValidator.predicate(
    "broken source named",
    "kind" in refused && refused.detail.includes("broken present source"),
  );
  const malformed: Scalar[][] = [[], [[0, 0, 0], ...ring.slice(1)]];
  for (const bad of malformed)
    TestValidator.equals(
      `malformed ${bad.length}`,
      AutoMovieEngineViewSectionField.prepare(bad, [
        shoulder,
        shoulder,
        shoulder,
        shoulder,
      ]).kind,
      "failure",
    );
  TestValidator.equals("field findings", failures, []);
}
