import {
  AutoMovieConicArcField,
  AutoMovieConicFieldJet,
  AutoMovieViewConic,
  AutoMovieViewOutline,
  AutoMovieViewSectionField,
} from "@automovie/engine";

import { ConstructionConicFieldBoundary } from "../../internal/construction/ConstructionConicFieldBoundary";
import { ConstructionConicFieldOracle } from "../../internal/construction/ConstructionConicFieldOracle";

/** Actual scalar station value/first/second, with the test station span one mm. */
type Scalar = AutoMovieViewSectionField.IStationJet;

/** Caller-owned preparation or its explicit refusal. */
type Prepared = AutoMovieViewSectionField.IPrepared;

/** Expected radial partials, with polar phi distinct from source p. */
type Radial = readonly [number, number, number, number, number, number];

/**
 * Original scalar 2-jets reach the native radial field without principal reinterpolation.
 *
 * Scenarios:
 * 1. Reciprocal ellipses at three scales, original quadratic/linear Outline sources and a varying square shoulder retain their independent radial six-jet expectations.
 * 2. Closed bivariate polynomial and exponential inputs distinguish source p Hessians from polar phi derivatives.
 * 3. Active G2 homothety, switching curvature owners and the same moving raw/cubic boundary test source2 and tangent1, including reflection.
 * 4. Cold, structured and JSON copies preserve results; fresh output and malformed present snapshots distinguish explicit data ownership from hidden admission history.
 * 5. Preparation, first phase and full phase traversal are component observations with no f1/world speed claim.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads prepare/read through original Outline jets, raw/G2 selection, source derivatives, value copies and explicit malformed failures; it detects lost scalar curvature, mixed/reflection mistakes and a stale numeric snapshot.
 * @evidence contracts/development/testing.md#independent-expectations Closed implicit ellipses, the square diagonal identity, direct polynomial source Hessians, exact guide curvatures, G2 homothety and the shared moving-boundary geometry supply expectations. Finite limit probes do not certify global C2 or physical poles, and no new lift or finite difference supplies its own oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers reciprocal eccentricities and three scales, nonzero sphi, varying shoulder, active G2 supports, both curvature owners, negative/periodic phases, aligned boundary paths, cold/copy/fresh outputs and bad input. Existing final-consumer phase25 and generic girth contracts remain their unchanged separate questions.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable synchronous CPU unit under --include construction_conic_field; no person generation, host, viewer, GPU, process or profiler is started.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Reciprocal ellipses at three scales, original quadratic/linear Outline sources and a varying square shoulder retain their independent...).
 */
export function test_construction_conic_field(): void {
  const failures: string[] = [];
  /** Each independent scenario preserves its failure while the remaining scenarios continue. */
  const ask: (name: string, body: () => void) => void = (
    name: string,
    body: () => void,
  ): void => {
    try {
      body();
    } catch (error: unknown) {
      failures.push(
        `${name}: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
      );
    }
  };
  /** Boundary questions use the identical source-size comparison and allowance. */
  const boundary: (
    actual: readonly number[],
    expected: readonly number[],
    scale: number,
    name: string,
  ) => void = (
    actual: readonly number[],
    expected: readonly number[],
    scale: number,
    name: string,
  ): void => close(actual, expected, scale, name, failures);
  ask("bivariate source algebra", (): void => algebra(failures));
  for (const scale of [0.001, 1, 1000])
    for (const aspect of [1, 2, 4, 8, 16, 32, 64])
      for (const reverse of [false, true]) {
        ask(`ellipse ${scale}/${aspect}/${reverse}`, (): void => {
          const a: Scalar = [scale * aspect, 0, 0];
          const b: Scalar = [scale, 0, 0];
          ellipses(
            reverse ? b : a,
            reverse ? a : b,
            failures,
            `ellipse ${scale}/${aspect}/${reverse}`,
            scale,
          );
        });
      }
  for (const scale of [0.001, 1, 1000]) {
    const a: AutoMovieViewOutline.IOutline = outline(
      scale,
      2 * scale,
      0,
      2 * scale,
      2 * scale,
    );
    const b: AutoMovieViewOutline.IOutline = outline(
      2 * scale,
      3 * scale,
      scale,
      scale,
      0,
    );
    for (const s of [0, 0.25, 0.5, 0.75, 1])
      ask(`original ${scale}/${s}`, (): void => {
        const aa: Scalar = scalar(a, s);
        const bb: Scalar = scalar(b, s);
        close(
          aa,
          [scale * (1 + s * s), 2 * scale * s, 2 * scale],
          scale,
          `original a ${s}`,
          failures,
        );
        close(
          bb,
          [scale * (2 + s), scale, 0],
          scale,
          `original b ${s}`,
          failures,
        );
        ellipses(aa, bb, failures, `original ${scale}/${s}`, scale);
        const r: Scalar = [0.3 + 0.05 * s, 0.05, 0];
        const square: Prepared = prepared([aa, aa, aa, aa], [r, r, r, r]);
        for (let q: number = 0; q < 4; q++)
          compare(
            square,
            Math.PI / 4 + (q * Math.PI) / 2,
            ConstructionConicFieldOracle.square(aa, r),
            scale,
            `square ${scale}/${s}/${q}`,
            failures,
          );
      });
  }
  ask("active G2 homothety", (): void => homothety(failures));
  ask("curvature-owner tie", (): void =>
    ConstructionConicFieldBoundary.tie(boundary),
  );
  ask("moving G2 boundaries", (): void =>
    ConstructionConicFieldBoundary.moving(boundary),
  );
  ask("explicit copy and failure", (): void => copies(failures));
  ask("component costs", (): void => costs());
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} native field findings:\n${failures.join("\n")}`,
    );
}

/** Compare independently derived scalar/Hessian components with the unchanged source-size budget. */
function close(
  actual: readonly number[],
  expected: readonly number[],
  scale: number,
  name: string,
  failures: string[],
  budget: number = 1e-7,
): void {
  for (let i: number = 0; i < expected.length; i++) {
    const allowance: number =
      budget * scale +
      256 *
        Number.EPSILON *
        Math.max(Math.abs(actual[i]!), Math.abs(expected[i]!));
    if (
      !(
        Number.isFinite(actual[i]) &&
        Math.abs(actual[i]! - expected[i]!) <= allowance
      )
    )
      failures.push(
        `${name}[${i}]: ${actual[i]} against ${expected[i]}, allowance ${allowance}`,
      );
  }
}

/** A failed preparation cannot become a replacement native shape. */
function prepared(
  extents: readonly Scalar[],
  shoulders: readonly Scalar[],
): Prepared {
  const value: Prepared | AutoMovieConicArcField.IFailure =
    AutoMovieViewSectionField.prepare(extents, shoulders);
  if (value.kind === "failure") throw new Error(value.detail);
  return value;
}

/** Read all required actual partials, preserving a named refusal as a finding. */
function radial(
  at: Prepared,
  phi: number,
): AutoMovieViewSectionField.IRadialJet {
  const value:
    | AutoMovieViewSectionField.IRadialJet
    | AutoMovieConicArcField.IFailure = AutoMovieViewSectionField.read(at, phi);
  if ("kind" in value) throw new Error(value.detail);
  return value;
}

/** Compare one actual field reading with an independent radial expectation. */
function compare(
  at: Prepared,
  phi: number,
  expected: Radial,
  scale: number,
  name: string,
  failures: string[],
): void {
  close(radial(at, phi), expected, scale, name, failures);
}

/** Two source coordinates test the full Hessian separately from polar mixed derivatives. */
function algebra(failures: string[]): void {
  const h: ReturnType<typeof ConstructionConicFieldOracle.polynomial> =
    ConstructionConicFieldOracle.polynomial(0.3, 0.4);
  close(
    AutoMovieConicFieldJet.AD.multiply(h.value, h.value),
    h.square,
    1,
    "product polynomial",
    failures,
    1e-12,
  );
  close(
    AutoMovieConicFieldJet.AD.sqrt(h.square),
    h.value,
    1,
    "sqrt polynomial",
    failures,
    1e-12,
  );
  close(
    AutoMovieConicFieldJet.AD.cbrt(h.cube),
    h.value,
    1,
    "cbrt polynomial",
    failures,
    1e-12,
  );
  close(
    AutoMovieConicFieldJet.AD.divide(h.cube, h.square),
    h.value,
    1,
    "quotient polynomial",
    failures,
    1e-12,
  );
  const E: number = Math.exp(0.7);
  const exponential: AutoMovieConicFieldJet.IJet = [
    E,
    E,
    2 * E,
    E,
    2 * E,
    4 * E,
  ];
  close(
    AutoMovieConicFieldJet.AD.exp([0.7, 1, 2, 0, 0, 0]),
    exponential,
    1,
    "exp linear",
    failures,
    1e-12,
  );
  close(
    AutoMovieConicFieldJet.AD.log(exponential),
    [0.7, 1, 2, 0, 0, 0],
    1,
    "log exponential",
    failures,
    1e-12,
  );
}

/** Authored endpoint jets define the original polynomial on a one-mm source interval. */
function outline(
  a: number,
  b: number,
  firstA: number,
  firstB: number,
  second: number,
): AutoMovieViewOutline.IOutline {
  const curve: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure =
    AutoMovieViewOutline.create({
      knots: [
        { site: "start", station: 0, value: a, jet: { first: firstA, second } },
        { site: "end", station: 1, value: b, jet: { first: firstB, second } },
      ],
    });
  if ("detail" in curve) throw new Error(curve.detail);
  return curve;
}

/** Read the original source owner, never fitted final phase samples. */
function scalar(source: AutoMovieViewOutline.IOutline, s: number): Scalar {
  const reading: AutoMovieViewOutline.IReading | string =
    AutoMovieViewOutline.at(source, s);
  if (typeof reading === "string") throw new Error(reading);
  if (reading.stationJet === null)
    throw new Error(
      `No actual regular station jet: ${reading.stationJetStatus}`,
    );
  return [reading.value, reading.stationJet[0], reading.stationJet[1]];
}

/** Independent implicit ellipses test every derivative and NUMBER/AD observable equality. */
function ellipses(
  a: Scalar,
  b: Scalar,
  failures: string[],
  name: string,
  scale: number,
): void {
  const r: Scalar = [Math.SQRT2 - 1, 0, 0];
  const at: Prepared = prepared([a, b, a, b], [r, r, r, r]);
  const e: number[] = [a[0], b[0], a[0], b[0]];
  const rs: number[] = [r[0], r[0], r[0], r[0]];
  const numeric: AutoMovieViewConic.ICurve = AutoMovieViewConic.prepareGeometry(
    AutoMovieConicFieldJet.NUMBER,
    e,
    rs,
    AutoMovieViewConic.curvatures(AutoMovieConicFieldJet.NUMBER, e, rs),
  );
  const phases: number[] = [
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
  ];
  for (const phi of phases) {
    const value: AutoMovieViewSectionField.IRadialJet = radial(at, phi);
    close(
      value,
      ConstructionConicFieldOracle.ellipse(a, b, phi),
      scale,
      `${name} phi ${phi}`,
      failures,
    );
    const numberJet: readonly number[] = AutoMovieViewConic.radius(
      numeric,
      phi,
    );
    close(
      [value[0], value[2], value[5]],
      numberJet,
      scale,
      `${name} NUMBER`,
      failures,
      0,
    );
  }
}

/** Homothety has an independent station law even inside a non-elliptic G2 end. */
function homothety(failures: string[]): void {
  const e: number[] = [3, 2, 4, 1];
  const r: number[] = [0.2, 0.4, 0.6, 0.3];
  const base: AutoMovieViewConic.ICurve = AutoMovieViewConic.prepareGeometry(
    AutoMovieConicFieldJet.NUMBER,
    e,
    r,
    AutoMovieViewConic.curvatures(AutoMovieConicFieldJet.NUMBER, e, r),
  );
  const phases: number[] = [0.13, -0.21];
  for (let q: number = 0; q < 4; q++) {
    const arc: AutoMovieViewConic.IQuarter = base.quarters[q]!;
    if (arc.start !== null)
      phases.push((q * Math.PI) / 2 + 0.37 * arc.start.angle);
    if (arc.end !== null)
      phases.push(((q + 1) * Math.PI) / 2 - 0.37 * arc.end.angle);
  }
  if (phases.length <= 2)
    throw new Error("The asymmetric source has no active G2 end");
  for (const s of [0, 0.5, 1]) {
    const h: number = 1 + s + s * s;
    const first: number = 1 + 2 * s;
    const at: Prepared = prepared(
      e.map((v: number): Scalar => [v * h, v * first, 2 * v]),
      r.map((v: number): Scalar => [v, 0, 0]),
    );
    for (const phi of phases) {
      const p: readonly number[] = AutoMovieViewConic.radius(base, phi);
      compare(
        at,
        phi,
        [
          h * p[0]!,
          first * p[0]!,
          h * p[1]!,
          2 * p[0]!,
          first * p[1]!,
          h * p[2]!,
        ],
        1,
        `homothety ${s}/${phi}`,
        failures,
      );
    }
  }
}

/** Cold, structured and JSON copies preserve values; malformed present data is refused without history. */
function copies(failures: string[]): void {
  const r: Scalar = [Math.SQRT2 - 1, 0, 0];
  const e: Scalar[] = [
    [3, 1, 2],
    [2, 0.5, 0],
    [3, 1, 2],
    [2, 0.5, 0],
  ];
  const at: Prepared = prepared(e, [r, r, r, r]);
  const expected: Radial = ConstructionConicFieldOracle.ellipse(
    e[0]!,
    e[1]!,
    0.37,
  );
  for (const copy of [
    structuredClone(at),
    JSON.parse(JSON.stringify(at)) as Prepared,
  ])
    compare(copy, 0.37, expected, 1, "cold value copy", failures);
  const value: AutoMovieViewSectionField.IRadialJet = radial(at, 0.37);
  const ray: AutoMovieViewConic.IRay | null = AutoMovieViewConic.read(
    at.geometry,
    0.37,
  );
  if (ray === null)
    failures.push("The same-geometry descriptor fixture was unavailable");
  else ConstructionConicFieldBoundary.malformed(at, ray, failures);
  value[0] = 999;
  compare(at, 0.37, expected, 1, "fresh radial output", failures);
  const stale: Prepared = structuredClone(at);
  stale.geometry.quarters[0]!.extents = [4, 2];
  if (!("kind" in AutoMovieViewSectionField.read(stale, 0.37)))
    failures.push("A stale numeric snapshot did not fail");
  const broken: Prepared = structuredClone(at);
  broken.source.failure = "broken present source";
  const refused: ReturnType<typeof AutoMovieViewSectionField.read> =
    AutoMovieViewSectionField.read(broken, 0.37);
  if (!("kind" in refused) || !refused.detail.includes("broken present source"))
    failures.push("A broken present source lost its named failure");
  if (!("kind" in AutoMovieViewSectionField.read(at, Infinity)))
    failures.push("A nonfinite phase did not fail");
  for (const bad of [
    [],
    [[0, 0, 0], ...e.slice(1)],
    [[3, NaN, 0], ...e.slice(1)],
  ]) {
    const result: ReturnType<typeof AutoMovieViewSectionField.prepare> =
      AutoMovieViewSectionField.prepare(bad as Scalar[], [r, r, r, r]);
    if (result.kind !== "failure")
      failures.push("Malformed or unavailable source 2-jets did not fail");
  }
}

/** Component-only preparation and phase timings have no f1/world/whole-surface speed claim. */
function costs(): void {
  const start: number = performance.now();
  const r: Scalar = [Math.SQRT2 - 1, 0, 0];
  const at: Prepared = prepared(
    [
      [3, 1, 2],
      [2, 0.5, 0],
      [3, 1, 2],
      [2, 0.5, 0],
    ],
    [r, r, r, r],
  );
  const preparedAt: number = performance.now();
  const first: AutoMovieViewSectionField.IRadialJet = radial(at, 0.37);
  const firstAt: number = performance.now();
  let checksum: number = first[0];
  for (let i: number = 0; i < 1024; i++)
    checksum += radial(at, (i * 2 * Math.PI) / 1024)[0];
  console.log({
    nativeFieldComponentCosts: {
      prepareMs: preparedAt - start,
      firstPhaseMs: firstAt - preparedAt,
      phases1024Ms: performance.now() - firstAt,
      checksum,
    },
    scope:
      "one synthetic component observation; no frame/lift/relief or f1 budget",
  });
}
