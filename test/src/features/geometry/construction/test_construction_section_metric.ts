import {
  AutoMovieViewSection,
  AutoMovieViewSectionConic,
  measureAutoMovieCurveLength64,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Actual original-source measurement and its observed numerical comparison. */
type Measurement = ReturnType<typeof AutoMovieViewSection.measure>;

/**
 * Fixed diagonal metrics measure the same original rational/G2 section.
 *
 * Scenarios:
 * 1. An unchanged3-by5 ellipse maps by [5,3] to a radius15 circle;
 *    a circle under [2,1] agrees with independent elementary ellipse
 *    derivatives. Reflections preserve the norm and uniform physical scaling
 *    preserves the resulting length units without changing the original source.
 * 2. An asymmetric G2 family is compared with the existing polar world-
 *    derivative GL8 K/2K consumer at its actual native-support boundaries.
 *    Normal-plane m and -m use the same metric1/hypot(1,m), including m=0.
 * 3. Native measure reads estimated targets1e-7 and5e-8, returning their
 *    actual difference; this is a refinement observation, not an error bound
 *    and not the polar K/2K rule. Original controls/weights/supports stay intact.
 * 4. Zero, nonfinite, malformed, overflowing and underflowing maps refuse;
 *    an original source failure remains observable and getter exceptions keep
 *    identity. Unscaled length remains the original native measurement.
 * 5. Independent circle circumference closes the actual shoulder solver at
 *    three scales. Nonfinite targets retain the public complete-range endpoint
 *    and its original named diagnostic, rather than becoming successful data.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls public ViewSection length/measure/solve/range on actual native sections, comparing independent geometric equations and existing original polar derivative integration while checking immutable source, complete-range endpoint diagnostics and explicit failures.
 * @evidence contracts/development/testing.md#independent-expectations Linear mapping of an exact3-by5 ellipse by(5,3) gives circle circumference30pi; a radius7 circle gives target14pi independently of the solver. Its original1e-6 native girth residual remains the acceptance limit. Other ellipse references integrate elementary sin/cos derivatives through the existing GL8 consumer; G2 references use the same actual source in a different polar parameter with its own K/2K convergence observation. Metric allowance is the native1e-7 target plus a1e-8 independently required reference observation and64epsilon arithmetic, not a claimed bound. Nonfinite requests keep the pre-existing retained lower endpoint for negative infinity and upper endpoint for NaN/positive infinity with one girth-in-reach diagnostic.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers unequal axes, quarter/reflected-end swaps, signed scale, signed/zero normal slope, three uniform unit scales, direct circle targets, NaN/positive/negative infinite targets, nontrivial G2 ends, genuine numeric refinement differences, malformed maps, source failure and original getter identity. Existing section/girth/source questions retain their original reach, inverse and geometry expectations.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous CPU construction_section_metric entry uses synthetic sections only, no Human generation, process, viewer or GPU; recorded timings describe actual invocation work and assert no speed ratio or f1 target.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: An unchanged3-by5 ellipse maps by [5,3] to a radius15 circle;).
 */
export function test_construction_section_metric(): void {
  const failures: string[] = [];
  const timings: {
    label: string;
    nativeMs: number;
    polarMs: number;
    native: Measurement;
    polar: Measurement;
  }[] = [];
  const rho: number = AutoMovieViewSection.ELLIPSE;

  // These invalid requests must preserve the original retained-endpoint
  // protocol after target-specific preparation declined to provide a solve.
  const box: AutoMovieViewSection.IBox = { extents: [3, 5, 3, 5] };
  const reach: AutoMovieViewSection.IRange | null =
    AutoMovieViewSection.range(box);
  if (reach === null)
    throw new Error("The unchanged metric fixture has no native reach");
  for (const target of [NaN, -Infinity, Infinity]) {
    const actual: AutoMovieViewSection.ISolved = AutoMovieViewSection.solve(
      "nonfinite target",
      box,
      target,
    );
    const endpoint: number =
      target === -Infinity ? reach.shoulder[0] : reach.shoulder[1];
    if (
      actual.section === null ||
      actual.section.shoulders.some((s: number): boolean => s !== endpoint) ||
      actual.diagnostics.length !== 1 ||
      actual.diagnostics[0]!.contract !== "girth in reach"
    )
      failures.push(
        "Nonfinite target lost its original retained-endpoint diagnostic " +
          target,
      );
  }
  for (const unit of [0.001, 1, 1000]) {
    const ellipse: AutoMovieViewSection.ISection = AutoMovieViewSection.bare(
      { extents: [3 * unit, 5 * unit, 3 * unit, 5 * unit] },
      [rho, rho, rho, rho],
    );
    const actual: Measurement = AutoMovieViewSection.measure(ellipse, [5, 3]);
    compare(
      actual.lengthMm,
      30 * Math.PI * unit,
      1e-7 + 64 * Number.EPSILON * 30 * Math.PI * unit,
      failures,
      "mapped exact circle",
    );
    compare(
      AutoMovieViewSection.length(ellipse, [-5, 3]),
      AutoMovieViewSection.length(ellipse, [5, 3]),
      0,
      failures,
      "reflection",
    );
    compare(
      AutoMovieViewSection.length(ellipse),
      AutoMovieViewSection.length(ellipse, [1, 1]),
      0,
      failures,
      "unscaled compatibility",
    );

    // Circle circumference is an independent target for the actual shoulder
    // solver; each changed physical scale owns a new numeric source family.
    const target: number = 14 * Math.PI * unit;
    const solved: AutoMovieViewSection.ISolved = AutoMovieViewSection.solve(
      "independent circle",
      { extents: [7 * unit, 7 * unit, 7 * unit, 7 * unit] },
      target,
    );
    if (solved.section === null || solved.diagnostics.length !== 0)
      failures.push("Independent circle target was not solved " + unit);
    else
      compare(
        solved.section.girth,
        target,
        1e-6,
        failures,
        "circle girth solve",
      );
  }
  const circle: AutoMovieViewSection.ISection = AutoMovieViewSection.bare(
    { extents: [7, 7, 7, 7] },
    [rho, rho, rho, rho],
  );
  const ellipseReference: Measurement = measureAutoMovieCurveLength64(
    [
      {
        domain: [0, 2 * Math.PI],
        derivative: (t: number): [number, number, number] => [
          -14 * Math.sin(t),
          7 * Math.cos(t),
          0,
        ],
      },
    ],
    32,
  );
  compare(
    AutoMovieViewSection.length(circle, [2, 1]),
    ellipseReference.lengthMm,
    1.1e-7,
    failures,
    "elementary ellipse",
  );
  const source: AutoMovieViewSection.ISection = AutoMovieViewSection.bare(
    { extents: [20, 9, 18, 11] },
    [0.3, 0.56, 0.4, 0.63],
  );
  if (
    source.conics.failure !== null ||
    !source.conics.quarters.some(
      (arc: (typeof source.conics.quarters)[number]): boolean =>
        arc.start !== null || arc.end !== null,
    )
  )
    failures.push(
      "The independent G2 case did not retain its actual corrected ends.",
    );
  const original: string = JSON.stringify(source);
  for (const scale of [
    [1, 1],
    [0.35, 1.7],
    [-0.35, 1.7],
    [2.2, -0.4],
  ] as const) {
    const start: number = performance.now();
    const native: Measurement = AutoMovieViewSection.measure(source, scale);
    const nativeEnd: number = performance.now();
    const polar: Measurement = reference(source, scale);
    const end: number = performance.now();
    timings.push({
      label: scale.join("/"),
      nativeMs: nativeEnd - start,
      polarMs: end - nativeEnd,
      native,
      polar,
    });
    converged(native, polar, failures, "original G2 metric");
  }
  for (const slope of [-3, 0, 3]) {
    const native: Measurement = AutoMovieViewSection.measure(source, [
      1 / Math.hypot(1, slope),
      1,
    ]);
    const polar: Measurement = reference(source, [1, 1], slope);
    converged(native, polar, failures, "actual normal plane");
  }
  if (JSON.stringify(source) !== original)
    failures.push(
      "Metric measurement changed original controls, weights, supports or observations.",
    );
  const coarse: number = AutoMovieViewSection.length(source, [0.35, 1.7]);
  const measured: Measurement = AutoMovieViewSection.measure(
    source,
    [0.35, 1.7],
  );
  const fine: number = AutoMovieViewSectionConic.length(
    source,
    [0.35, 1.7],
    5e-8,
  );
  compare(measured.lengthMm, fine, 0, failures, "actual finer native target");
  compare(
    measured.differenceMm,
    Math.abs(fine - coarse),
    0,
    failures,
    "actual native target-refinement observation",
  );
  refused(source, failures);
  console.log({
    fixedNativeMetric: timings,
    scope:
      "synthetic functional walltime only; not a Human neck or full-figure speed claim",
  });
  TestValidator.predicate(
    failures.join("\n"),
    (): boolean => failures.length === 0,
  );
}

/** Existing polar derivative consumer, with exact original G2 support boundaries retained. */
function reference(
  source: AutoMovieViewSection.ISection,
  scale: readonly [number, number],
  slope?: number,
): Measurement {
  const cuts: Set<number> = new Set([
    0,
    2 * Math.PI,
    ...source.knots.map(
      (k: AutoMovieViewSection.ISection["knots"][number]): number => k.angle,
    ),
  ]);
  for (const [q, arc] of source.conics.quarters.entries()) {
    cuts.add((q * Math.PI) / 2);
    if (arc.start !== null) cuts.add((q * Math.PI) / 2 + arc.start.angle);
    if (arc.end !== null) cuts.add(((q + 1) * Math.PI) / 2 - arc.end.angle);
  }
  const marks: number[] = [...cuts].sort(
    (a: number, b: number): number => a - b,
  );
  return measureAutoMovieCurveLength64(
    marks
      .slice(1)
      .map(
        (
          end: number,
          i: number,
        ): Parameters<typeof measureAutoMovieCurveLength64>[0][number] => ({
          domain: [marks[i]!, end],
          derivative: (theta: number): [number, number, number] => {
            const [r, first]: [number, number, number] =
              AutoMovieViewSection.radius(source, theta);
            const du: number = first * Math.cos(theta) - r * Math.sin(theta);
            const dv: number = first * Math.sin(theta) + r * Math.cos(theta);
            if (slope === undefined) return [scale[0] * du, scale[1] * dv, 0];
            const h2: number = 1 + slope * slope;
            return [du / h2, (-slope * du) / h2, dv];
          },
        }),
      ),
    8,
  );
}

/** The old polar numerical observation must itself converge, rather than enlarging the oracle allowance. */
function converged(
  actual: Measurement,
  expected: Measurement,
  failures: string[],
  label: string,
): void {
  if (
    !(
      Number.isFinite(actual.differenceMm) &&
      actual.differenceMm <= 1e-7 &&
      Number.isFinite(expected.differenceMm) &&
      expected.differenceMm <= 1e-8
    )
  )
    failures.push(
      label +
        ": native or polar refinement did not converge to its stated observation target.",
    );
  compare(
    actual.lengthMm,
    expected.lengthMm,
    1.1e-7 + 64 * Number.EPSILON * Math.abs(expected.lengthMm),
    failures,
    label,
  );
}

/** Invalid linear maps and original source failures never become finite successful lengths. */
function refused(
  source: AutoMovieViewSection.ISection,
  failures: string[],
): void {
  const maps: readonly (readonly number[])[] = [
    [0, 1],
    [1, 0],
    [Number.NaN, 1],
    [1, Infinity],
    [1],
    [Number.MAX_VALUE, Number.MAX_VALUE],
  ];
  for (const map of maps) {
    const result: Measurement = AutoMovieViewSection.measure(
      source,
      map as readonly [number, number],
    );
    if (
      Number.isFinite(result.lengthMm) ||
      Number.isFinite(result.differenceMm)
    )
      failures.push(
        "An unsupported or unrepresentable metric returned success.",
      );
  }
  const rho: number = AutoMovieViewSection.ELLIPSE;
  const tiny: AutoMovieViewSection.ISection = AutoMovieViewSection.bare(
    { extents: [0.1, 0.1, 0.1, 0.1] },
    [rho, rho, rho, rho],
  );
  if (
    Number.isFinite(
      AutoMovieViewSection.length(tiny, [Number.MIN_VALUE, Number.MIN_VALUE]),
    )
  )
    failures.push(
      "A metric whose whole coordinate scale underflows returned success.",
    );
  const invalid: AutoMovieViewSection.ISection = {
    ...source,
    conics: { ...source.conics, failure: "original source failure" },
  };
  if (Number.isFinite(AutoMovieViewSection.length(invalid, [1, 1])))
    failures.push("Metric length masked the original source failure.");
  const marker: Error = new Error("actual original source getter");
  const foreign: AutoMovieViewSection.ISection = {
    ...source,
    conics: {
      ...source.conics,
      get failure(): never {
        throw marker;
      },
    },
  };
  let caught: unknown;
  try {
    AutoMovieViewSection.measure(foreign, [1, 1]);
  } catch (error: unknown) {
    caught = error;
  }
  if (caught !== marker)
    failures.push("Metric measurement changed an original getter exception.");
}

/** A fixed numerical allowance states its two methods' observed accuracy, never a fitted source. */
function compare(
  actual: number,
  expected: number,
  tolerance: number,
  failures: string[],
  label: string,
): void {
  if (!nclose(actual, expected, tolerance))
    failures.push(
      label +
        ": actual " +
        actual +
        ", expected " +
        expected +
        ", allowance " +
        tolerance,
    );
}
