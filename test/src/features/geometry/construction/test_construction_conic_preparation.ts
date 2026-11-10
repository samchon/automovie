import {
  AutoMovieConicFieldJet,
  AutoMovieConicHermite,
  AutoMovieViewConic,
  AutoMovieViewSectionField,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import type { Profiler } from "node:inspector";
import { Session } from "node:inspector/promises";

import { ConstructionConicFieldOracle } from "../../internal/construction/ConstructionConicFieldOracle";
import { nclose } from "../../internal/nclose";

/** Actual regular station value and its first two derivatives. */
type Scalar = AutoMovieViewSectionField.IStationJet;

/** Caller-owned successful field preparation. */
type Prepared = AutoMovieViewSectionField.IPrepared;

/**
 * One station preparation reuses its own endpoint curvatures without changing its field.
 *
 * Scenarios:
 * 1. Symmetric ellipses, asymmetric active G2 ends and three scales agree with
 *    the unchanged public generic composition, including complete source tuples.
 * 2. Implicit ellipse radial derivatives independently check the actual field;
 *    changed-copy, fresh-output and input admission retain their meanings.
 * 3. Public generic callback order and original thrown values remain observable;
 *    invalid geometry is rejected before end arithmetic.
 * 4. Owned precise coverage observes at most eight endpoint-curvature calls per
 *    successful Field.prepare, allowing fewer calls and refusing missing coverage.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual Field.prepare/read and public generic curvature/geometry/end producers; catches lost derivatives, changed admission/effects and duplicated endpoint calculation in that public field operation.
 * @evidence contracts/development/testing.md#independent-expectations Implicit ellipses provide independent radial six-jets and positive finite output. Generic composition is a compatibility oracle sharing primitives, not independent geometry. Four quarters have eight own endpoints, so eight curvature calls is a work ceiling; absent function observations cannot pass as zero.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers ellipse ties, asymmetric active G2 ends, reciprocal scales, negative/periodic phases, fresh/copy data, malformed/overflow inputs, generic callback order and original Error/undefined failures. Existing conic_field/source_conic/projective questions retain general boundary and arclength coverage.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable async CPU test owns synthetic inputs and a current-process Inspector Session, stopped/disabled/disconnected in finally with primary errors preserved. No person, browser, target attachment, CPU profile, foreign method patch or elapsed/heap budget is used.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Symmetric ellipses, asymmetric active G2 ends and three scales agree with).
 */
export async function test_construction_conic_preparation(): Promise<void> {
  const failures: string[] = [];
  for (const scale of [0.001, 1, 1000]) {
    ask(`ellipse ${scale}`, (): void => equivalent(scale, true), failures);
    ask(`G2 ${scale}`, (): void => equivalent(scale, false), failures);
  }
  ask("public effects", effects, failures);
  ask("input admission", admission, failures);
  try {
    const counts: number[] = await work();
    console.log({
      conicPreparationWork: counts,
      ceiling: 8,
      scope: "endpoint calls per field preparation; no wall/heap claim",
    });
    if (counts.some((count: number): boolean => count > 8))
      failures.push(
        `Endpoint work ${counts.join("/")} exceeds eight own endpoints`,
      );
  } catch (error: unknown) {
    failures.push("coverage: " + detail(error));
  }
  TestValidator.predicate(
    failures.join("\n"),
    (): boolean => failures.length === 0,
  );
}

/** Preserve all independent case results before reporting their combined findings. */
function ask(name: string, job: () => void, failures: string[]): void {
  try {
    job();
  } catch (error: unknown) {
    failures.push(name + ": " + detail(error));
  }
}

/** Original errors retain their stack while non-Error values remain distinguishable. */
function detail(error: unknown): string {
  return error instanceof Error
    ? (error.stack ?? error.message)
    : String(error);
}

/** Use finite actual station tuples, rather than principal-section interpolation. */
function inputs(scale: number, ellipse: boolean): { e: Scalar[]; r: Scalar[] } {
  return {
    e: (ellipse ? [3, 2, 3, 2] : [3, 2, 4, 1]).map(
      (value: number): Scalar => [
        scale * value,
        (scale * value) / 5,
        (-scale * value) / 7,
      ],
    ),
    r: (ellipse
      ? [Math.SQRT2 - 1, Math.SQRT2 - 1, Math.SQRT2 - 1, Math.SQRT2 - 1]
      : [0.2, 0.4, 0.6, 0.3]
    ).map(
      (value: number): Scalar => [
        value,
        ellipse ? 0 : 0.01,
        ellipse ? 0 : -0.02,
      ],
    ),
  };
}

/** Require named preparation success before comparing any numerical result. */
function made(e: readonly Scalar[], r: readonly Scalar[]): Prepared {
  const result: ReturnType<typeof AutoMovieViewSectionField.prepare> =
    AutoMovieViewSectionField.prepare(e, r);
  if (result.kind === "failure") throw new Error(result.detail);
  return result;
}

/** Compare the entire data contract, with IEEE nonfinite states explicit rather than silently omitted. */
function same(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number")
    return Number.isFinite(a) && Number.isFinite(b)
      ? nclose(a, b, 0)
      : Object.is(a, b);
  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object"
  )
    return a === b;
  const aa: Record<string, unknown> = a as Record<string, unknown>;
  const bb: Record<string, unknown> = b as Record<string, unknown>;
  const keys: string[] = Object.keys(aa);
  return (
    keys.length === Object.keys(bb).length &&
    keys.every(
      (key: string): boolean =>
        Object.hasOwn(bb, key) && same(aa[key], bb[key]),
    )
  );
}

/** Generic composition is a separate compatibility path; the implicit ellipse owns independent geometry. */
function equivalent(scale: number, ellipse: boolean): void {
  const { e, r }: ReturnType<typeof inputs> = inputs(scale, ellipse);
  const at: Prepared = made(e, r);
  const ee: AutoMovieConicFieldJet.IJet[] = e.map(
    AutoMovieConicFieldJet.fromStation,
  );
  const rr: AutoMovieConicFieldJet.IJet[] = r.map(
    AutoMovieConicFieldJet.fromStation,
  );
  const expected: AutoMovieViewConic.ICurve<AutoMovieConicFieldJet.IJet> =
    AutoMovieViewConic.prepareGeometry(
      AutoMovieConicFieldJet.AD,
      ee,
      rr,
      AutoMovieViewConic.curvatures(AutoMovieConicFieldJet.AD, ee, rr),
    );
  if (
    !same(at.source, expected) ||
    !same(
      at.geometry,
      AutoMovieViewConic.primal(AutoMovieConicFieldJet.AD, expected),
    )
  )
    throw new Error("The generic source/lookup composition changed");
  if (
    !ellipse &&
    !at.source.quarters.some(
      (
        quarter: AutoMovieViewConic.IQuarter<AutoMovieConicFieldJet.IJet>,
      ): boolean => quarter.start !== null || quarter.end !== null,
    )
  )
    throw new Error("The asymmetric case did not exercise G2 ends");
  for (const phi of [
    0,
    0.13,
    Math.PI / 4,
    Math.PI / 2,
    -0.17,
    2 * Math.PI + 0.13,
  ]) {
    const value: ReturnType<typeof AutoMovieViewSectionField.read> =
      AutoMovieViewSectionField.read(at, phi);
    if ("kind" in value || !value.every(Number.isFinite))
      throw new Error(
        "A successful finite field lost its actual radial reading",
      );
    if (ellipse) {
      const target: readonly number[] = ConstructionConicFieldOracle.ellipse(
        e[0]!,
        e[1]!,
        phi,
      );
      if (
        !value.every((entry: number, i: number): boolean =>
          nclose(
            entry,
            target[i]!,
            1e-7 * scale + 256 * Number.EPSILON * Math.abs(target[i]!),
          ),
        )
      )
        throw new Error("The independent implicit ellipse changed");
    }
  }
  const again: Prepared = made(e, r);
  if (
    again.source === at.source ||
    again.source.quarters[0] === at.source.quarters[0]
  )
    throw new Error("Independent preparations shared mutable output records");
  const copy: Prepared = structuredClone(at);
  copy.geometry.quarters[0]!.extents = [99, 99];
  if (!("kind" in AutoMovieViewSectionField.read(copy, 0)))
    throw new Error("A changed present snapshot was accepted");
  if (!same(at, again))
    throw new Error("Mutating a copied result changed another preparation");
}

/** Generic callers can observe values and errors; the optimized fixed-AD caller must not change them. */
function effects(): void {
  const values: number[] = [];
  const ops: AutoMovieConicFieldJet.IAlgebra<number> = {
    ...AutoMovieConicFieldJet.NUMBER,
    value: (value: number): number => {
      values.push(value);
      return value;
    },
  };
  AutoMovieViewConic.curvatures(ops, [1, 2, 3, 4], [0.5, 0.5, 0.5, 0.5]);
  const expected: number[] = [
    1 / 32,
    1 / 8,
    1 / 32,
    1 / 8,
    1,
    1 / 9,
    1,
    1 / 9,
    3 / 8,
    3 / 32,
    3 / 8,
    3 / 32,
    2 / 9,
    2,
    2 / 9,
    2,
  ];
  if (!same(values, expected))
    throw new Error("Public curvature callback order changed");
  const originals: readonly unknown[] = [
    new Error("owned algebra failure"),
    undefined,
  ];
  for (const original of originals) {
    let seen: boolean = false;
    const throwing: AutoMovieConicFieldJet.IAlgebra<number> = {
      ...ops,
      value: (_value: number): number => {
        throw original;
      },
    };
    try {
      AutoMovieViewConic.curvatures(
        throwing,
        [1, 2, 3, 4],
        [0.5, 0.5, 0.5, 0.5],
      );
    } catch (error: unknown) {
      if (error !== original)
        throw new Error("The original callback failure changed");
      seen = true;
    }
    if (!seen) throw new Error("The callback failure was swallowed");
  }
  const refuseArithmetic: AutoMovieConicFieldJet.IAlgebra<number> = {
    ...ops,
    divide: (_a: number, _b: number): number => {
      throw new Error("End arithmetic must not precede admission");
    },
  };
  if (
    AutoMovieViewConic.prepareGeometry(
      refuseArithmetic,
      [1, 2, 3, 4],
      [0.5, 0.5, 0.5, 0.5],
      [0, 1, 1, 1],
    ).failure === null
  )
    throw new Error("Nonpositive shared curvature was admitted");
  if (AutoMovieConicHermite.prepare(ops, 2, 3, 0.5, 1 / 9) !== null)
    throw new Error("Equal own/shared curvature created a replacement end");

  // Public generic assembly evaluates both ends before reporting the first failure.
  let divisions: number = 0;
  const counted: AutoMovieConicFieldJet.IAlgebra<number> = {
    ...ops,
    divide: (a: number, b: number): number => {
      divisions++;
      return a / b;
    },
  };
  const refused: AutoMovieViewConic.ICurve = AutoMovieViewConic.prepareGeometry(
    counted,
    [1, 2, 3, 4],
    [0.5, 0.5, 0.5, 0.5],
    [1000, 1000, 1000, 1000],
  );
  if (
    divisions !== 4 ||
    !refused.failure?.startsWith("quarter 0: G2 conic end needs")
  )
    throw new Error(
      "The second public end was skipped after the first end's refusal",
    );
}

/** Invalid station inputs and finite overflow keep named refusals, without a replacement shape. */
function admission(): void {
  const { e, r }: ReturnType<typeof inputs> = inputs(1, true);
  const malformed: readonly Scalar[][] = [
    [],
    [[0, 0, 0], ...e.slice(1)],
    [[NaN, 0, 0], ...e.slice(1)],
    [[1, Infinity, 0], ...e.slice(1)],
  ];
  for (const bad of malformed)
    if (AutoMovieViewSectionField.prepare(bad, r).kind !== "failure")
      throw new Error("Malformed/empty station input was admitted");
  for (const value of [0, 1, NaN])
    if (
      AutoMovieViewSectionField.prepare(
        e,
        r.map((): Scalar => [value, 0, 0]),
      ).kind !== "failure"
    )
      throw new Error("An invalid shoulder was admitted");
  const huge: Scalar[] = [1e308, 1e-308, 1e308, 1e-308].map(
    (value: number): Scalar => [value, 0, 0],
  );
  if (AutoMovieViewSectionField.prepare(huge, r).kind !== "failure")
    throw new Error("Unrepresentable curvature arithmetic became a shape");
}

/** Count only actual endpoint calls in each public field preparation and release the owned observer on every path. */
async function work(): Promise<number[]> {
  const session: Session = new Session();
  const counts: number[] = [];
  const cleanup: unknown[] = [];
  let connected: boolean = false;
  let started: boolean = false;
  let failed: boolean = false;
  let primary: unknown;
  try {
    session.connect();
    connected = true;
    await session.post("Profiler.enable");
    await session.post("Profiler.startPreciseCoverage", {
      callCount: true,
      detailed: false,
    });
    started = true;
    for (const ellipse of [true, false]) {
      const { e, r }: ReturnType<typeof inputs> = inputs(1, ellipse);
      made(e, r);
      const coverage: Profiler.TakePreciseCoverageReturnType =
        await session.post("Profiler.takePreciseCoverage");
      const scripts: Profiler.ScriptCoverage[] = coverage.result.filter(
        (script: Profiler.ScriptCoverage): boolean =>
          /[/\\]AutoMovieConicArcField\.ts$/.test(script.url),
      );
      if (scripts.length !== 1)
        throw new Error(
          "The actual endpoint formula script is absent or ambiguous",
        );
      const functions: Profiler.FunctionCoverage[] =
        scripts[0]!.functions.filter(
          (fn: Profiler.FunctionCoverage): boolean =>
            fn.functionName === "curvature",
        );
      if (functions.length !== 1)
        throw new Error(
          "The actual endpoint formula function is absent or ambiguous",
        );
      const count: number | undefined = functions[0]!.ranges[0]?.count;
      if (count === undefined || !Number.isSafeInteger(count) || count <= 0)
        throw new Error(
          "The real field operation has no observed endpoint work",
        );
      counts.push(count);
    }
  } catch (error: unknown) {
    failed = true;
    primary = error;
  } finally {
    if (started)
      try {
        await session.post("Profiler.stopPreciseCoverage");
      } catch (error: unknown) {
        cleanup.push(error);
      }
    if (connected) {
      try {
        await session.post("Profiler.disable");
      } catch (error: unknown) {
        cleanup.push(error);
      }
      try {
        session.disconnect();
      } catch (error: unknown) {
        cleanup.push(error);
      }
    }
  }
  if (failed) throw primary;
  if (cleanup.length !== 0)
    throw new AggregateError(cleanup, "Owned endpoint coverage cleanup failed");
  return counts;
}
