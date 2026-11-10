import {
  AutoMovieLoftChain,
  AutoMovieLoftJet,
  AutoMovieLoftPhaseSource,
  AutoMovieSplineCurve,
  AutoMovieViewAxis,
  type AutoMovieViewConic,
  AutoMovieViewLoft,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { ConstructionLoftSectionAdapters } from "../../internal/construction/ConstructionLoftSectionAdapters";
import { ConstructionLoftSectionBoundary } from "../../internal/construction/ConstructionLoftSectionBoundary";
import { ConstructionLoftSectionConsumers } from "../../internal/construction/ConstructionLoftSectionConsumers";
import { ConstructionPhaseSourceComparison } from "../../internal/construction/ConstructionPhaseSourceComparison";
import { nclose } from "../../internal/nclose";

/**
 * Exact native ellipse phases are compared with actual final-loft consumers.
 *
 * Scenarios:
 * 1. Aspects 1,2,4,8,16,32,64, reciprocal orientations and three length scales retain the source/box budgets through candidate native points/jets at and between identical layers; actual ViewLoft point/Jet/surface must satisfy the same convexity/support expectations.
 * 2. The old direct periodic Cartesian cubic remains a negative mathematical witness, not a convexity promise of SplineCurve's interpolation API.
 * 3. A three-layer homothetic ellipse agrees with an independent closed-form natural spline and its station/phase/mixed derivatives; numeric copies preserve the source and invalid inputs fail explicitly.
 * 4. A four-layer circle counterexample demonstrates that native principal preservation does not guarantee positive intermediate radii. Prepared-query cost is reported for L=2,8,32,128 against the existing phase basis without a speed assertion.
 * 5. The actual authored source a(s)=1+s squared,b(s)=2 retains its scalar 2-jet and direct native phase jet, while a second principal interpolation loses0.25 mm at the midpoint. The same original source remains the expectation for final point/Jet/surface consumers.
 * 6. Actual original total2, four native continuation end signs, a tiny mixed complementary weight, cap support derivatives, scalar bridge laws, finite Point0 without physical2, cold copies and held samplers distinguish production ownership and capability boundaries.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the new disconnected source helper and the real ViewLoft chain through point, Jet and surface. Convexity/support failures remain failures in the final consumers; the old direct spline is retained separately as a diagnostic counterexample.
 * @evidence contracts/development/testing.md#independent-expectations Ellipse radius is1/hypot(cos/a,sin/b), implicit residual budget3e-7 and source-radius budget1e-7 times the short extent are unchanged. Cartesian signed curvature uses64epsilon times the two product magnitudes and support allowance256epsilon times the long extent. The three-layer natural spline has middle curvature-3 for scale data[1,2,1] on[0,1,2]. The four-layer[1,1,10,1] scale spline equals-0.35 at0.5. Authored endpoint jets independently specify a(s)=1+s squared; its middle1.25 cannot be replaced by linear1.5. Timing is observation only, and no finite sample sweep certifies a continuous bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Preserves the original thin/ordinary, scale, reflection and rejected-candidate witnesses; additionally distinguishes actual scalar/mixed derivatives, all continuation directions, tiny cap/mixed weights, finite values versus unavailable physical2, malformed/stale data and copy/cache/output lifetimes.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU unit through --include construction_phase_fidelity; all scenarios collect into one complete question. Synthetic source/basis fixtures only, no person generation, process, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Aspects 1,2,4,8,16,32,64, reciprocal orientations and three length scales retain the source/box budgets through candidate native...).
 */
export function test_construction_phase_fidelity(): void {
  const failures: string[] = [];
  const witness: string[] = [];
  for (const aspect of [1, 2, 4, 8, 16, 32, 64])
    for (const swap of [false, true])
      for (const scale of [0.001, 1, 1000]) {
        try {
          const a: number = scale * (swap ? aspect : 1);
          const b: number = scale * (swap ? 1 : aspect);
          const original: AutoMovieViewSection.ISection = ellipse(a, b);
          const prepared: AutoMovieLoftPhaseSource.ISource | string =
            AutoMovieLoftPhaseSource.prepare(
              [0, 1],
              [original.conics, original.conics],
            );
          if (typeof prepared === "string") {
            failures.push(prepared);
            continue;
          }
          const candidate: AutoMovieLoftPhaseSource.IStation =
            AutoMovieLoftPhaseSource.station(prepared, 0.37);
          const result: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(
            part(a, b),
          );
          if (result.chain === null || result.surface === null) {
            failures.push(
              `actual ellipse ${aspect}/${swap}/${scale}: no chain/surface; ${JSON.stringify(result.diagnostics)}`,
            );
            continue;
          }
          const exactPoints: [number, number][] = Array.from(
            { length: 32 },
            (_: unknown, i: number): [number, number] => {
              const q: number[] = oracle(a, b, (2 * Math.PI * i) / 32);
              return [q[0]!, q[1]!];
            },
          );
          const old: number[] = AutoMovieSplineCurve.interpolate(exactPoints);
          let sourceRadius: number = 0;
          let sourceImplicit: number = 0;
          let sourceOutside: number = 0;
          let sourceInward: number = 0;
          let finalOutside: number = 0;
          let finalInward: number = 0;
          let finalPointMismatch: number = 0;
          let oldOutside: number = 0;
          let oldInward: number = 0;
          for (let i: number = 0; i < 512; i++) {
            const phi: number = (2 * Math.PI * (i + 0.37)) / 512;
            const q: number[] = AutoMovieLoftPhaseSource.jet(
              candidate,
              phi,
            )[0]!;
            const point: [number, number] = AutoMovieLoftPhaseSource.point(
              candidate,
              phi,
            );
            const expected: number[] = oracle(a, b, phi);
            sourceRadius = Math.max(
              sourceRadius,
              Math.hypot(q[0]! - expected[0]!, q[1]! - expected[1]!),
            );
            sourceImplicit = Math.max(
              sourceImplicit,
              Math.abs((q[0]! / a) ** 2 + (q[1]! / b) ** 2 - 1),
            );
            if (outside(q, a, b)) sourceOutside++;
            if (inward(q)) sourceInward++;
            if (
              !nclose(point[0], q[0]!, 256 * Number.EPSILON * Math.max(a, b)) ||
              !nclose(point[1], q[1]!, 256 * Number.EPSILON * Math.max(a, b))
            )
              failures.push("candidate point/jet mismatch");
            const legacy: number[] = AutoMovieSplineCurve.jet(old, 32, phi);
            if (outside(legacy, a, b)) oldOutside++;
            if (inward(legacy)) oldInward++;
            const final: AutoMovieLoftJet.IJet = AutoMovieLoftJet.at(
              result.chain,
              0.37,
              phi,
            );
            const actual: number[] = [
              final.p[0],
              final.p[2],
              final.t[0],
              final.t[2],
              final.tt[0],
              final.tt[2],
            ];
            if (outside(actual, a, b)) finalOutside++;
            if (inward(actual)) finalInward++;
            const finalPoint: [number, number, number] =
              AutoMovieLoftChain.point(result.chain, 0.37, phi);
            const finalSurface: number[] = result.surface.jet(0.37, phi).p;
            if (
              ![finalPoint, finalSurface].every(
                (p: readonly number[]): boolean =>
                  p.every((value: number, k: number): boolean =>
                    nclose(
                      value,
                      final.p[k]!,
                      256 * Number.EPSILON * Math.max(a, b, 1),
                    ),
                  ),
              )
            )
              finalPointMismatch++;
          }
          if (
            sourceRadius > 1e-7 * Math.min(a, b) ||
            sourceImplicit > 3e-7 ||
            sourceOutside !== 0 ||
            sourceInward !== 0
          )
            failures.push(
              `native ${aspect}/${swap}/${scale}: radius ${sourceRadius}, implicit ${sourceImplicit}, outside ${sourceOutside}, inward ${sourceInward}`,
            );
          if (
            finalOutside !== 0 ||
            finalInward !== 0 ||
            finalPointMismatch !== 0
          )
            failures.push(
              `actual final ${aspect}/${swap}/${scale}: outside ${finalOutside}, inward ${finalInward}, point/Jet/surface disagreement ${finalPointMismatch}`,
            );
          if (oldOutside !== 0 || oldInward !== 0)
            witness.push(
              `${aspect}/${swap}/${scale}: outside ${oldOutside}, inward ${oldInward}`,
            );
        } catch (error: unknown) {
          failures.push(
            `phase case ${aspect}/${swap}/${scale} threw: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
          );
        }
      }
  if (witness.length === 0)
    failures.push(
      "the old Cartesian cubic mathematical counterexample was not observed",
    );
  console.log({ phaseLegacyCounterexamples: witness });
  for (const [name, observe] of [
    ["interpolation", (): void => interpolation(failures)],
    [
      "original source",
      (): void => ConstructionPhaseSourceComparison.sources(failures),
    ],
    [
      "boundary laws",
      (): void => ConstructionLoftSectionBoundary.observe(failures, part(1, 2)),
    ],
    [
      "actual consumers",
      (): void =>
        ConstructionLoftSectionConsumers.observe(failures, part(1, 2)),
    ],
    [
      "source-aware adapters",
      (): void => ConstructionLoftSectionAdapters.observe(failures, part(1, 2)),
    ],
    ["costs", (): void => ConstructionPhaseSourceComparison.costs(failures)],
  ] as const) {
    try {
      observe();
    } catch (error: unknown) {
      failures.push(
        `${name} observation threw: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
      );
    }
  }
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} phase fidelity findings:\n${failures.join("\n")}`,
    );
}

/** An unchanged source ellipse, prepared without girth quadrature. */
function ellipse(a: number, b: number): AutoMovieViewSection.ISection {
  return AutoMovieViewSection.bare({ extents: [a, b, a, b] }, [
    Math.SQRT2 - 1,
    Math.SQRT2 - 1,
    Math.SQRT2 - 1,
    Math.SQRT2 - 1,
  ]);
}

/** The independent implicit ellipse and its analytic polar phase derivatives. */
function oracle(a: number, b: number, phi: number): number[] {
  const c: number = Math.cos(phi);
  const s: number = Math.sin(phi);
  const r: number = 1 / Math.hypot(c / a, s / b);
  const difference: number = 1 / (b * b) - 1 / (a * a);
  const d: number = 2 * c * s * difference;
  const dd: number = 2 * (c * c - s * s) * difference;
  const first: number = -0.5 * d * r ** 3;
  const second: number = 0.75 * d * d * r ** 5 - 0.5 * dd * r ** 3;
  return [
    r * c,
    r * s,
    first * c - r * s,
    first * s + r * c,
    (second - r) * c - 2 * first * s,
    (second - r) * s + 2 * first * c,
  ];
}

/** Exact axis supports with the original binary64 summation allowance. */
function outside(q: readonly number[], a: number, b: number): boolean {
  const allowance: number = 256 * Number.EPSILON * Math.max(a, b);
  return (
    !q.every(Number.isFinite) ||
    Math.abs(q[0]!) > a + allowance ||
    Math.abs(q[1]!) > b + allowance
  );
}

/** Signed Cartesian curvature with the original cancellation allowance. */
function inward(q: readonly number[]): boolean {
  const first: number = q[2]! * q[5]!;
  const second: number = q[3]! * q[4]!;
  return (
    !q.every(Number.isFinite) ||
    first - second < -64 * Number.EPSILON * (Math.abs(first) + Math.abs(second))
  );
}

/** One constant ellipse passed through the actual view-loft producer. */
function part(a: number, b: number): IAutoMovieViewPart {
  const outline: (value: number) => IAutoMovieViewPart.IOutline = (
    value: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: [
      { site: "start", station: 0, value },
      { site: "end", station: 1, value },
    ],
  });
  return {
    name: "phase.ellipse",
    axis: AutoMovieViewAxis.horizontal(),
    stations: [0, 1],
    front: { positive: outline(a), negative: outline(-a) },
    side: { positive: outline(b), negative: outline(-b) },
    fullness: { kind: "shoulder", shoulder: outline(Math.SQRT2 - 1) },
    order: 32,
    samples: 32,
  };
}

/** Independent natural-spline values, copying, chain rules and an off-layer failure witness. */
function interpolation(failures: string[]): void {
  const curves: AutoMovieViewConic.ICurve[] = [1, 2, 1].map(
    (scale: number): AutoMovieViewConic.ICurve =>
      ellipse(scale, 2 * scale).conics,
  );
  const made: AutoMovieLoftPhaseSource.ISource | string =
    AutoMovieLoftPhaseSource.prepare([0, 1, 2], curves);
  if (typeof made === "string") {
    failures.push(made);
    return;
  }
  const jsonCopy: AutoMovieLoftPhaseSource.ISource = JSON.parse(
    JSON.stringify(made),
  ) as AutoMovieLoftPhaseSource.ISource;
  const regular: AutoMovieLoftPhaseSource.IStation =
    AutoMovieLoftPhaseSource.station(made, 0.5);
  const badWeights: AutoMovieLoftPhaseSource.IStation = {
    ...regular,
    weights: [[NaN, 0, 0], regular.weights[1]!, regular.weights[2]!],
  };
  const badSource: AutoMovieLoftPhaseSource.IStation = {
    ...regular,
    source: {
      ...made,
      curves: [
        curves[0]!,
        { quarters: [], failure: "broken present source" },
        curves[2]!,
      ],
    },
  };
  for (const observe of [
    (): unknown => AutoMovieLoftPhaseSource.point(badWeights, 0),
    (): unknown => AutoMovieLoftPhaseSource.jet(badSource, 0),
    (): unknown => AutoMovieLoftPhaseSource.station(made, -1),
    (): unknown => AutoMovieLoftPhaseSource.station(made, 0.5, [1, Infinity]),
  ])
    if (!rejects(observe))
      failures.push("malformed explicit phase data was not rejected");
  if (
    typeof AutoMovieLoftPhaseSource.prepare(
      [-Number.MAX_VALUE, Number.MAX_VALUE],
      [curves[0]!, curves[0]!],
    ) !== "string"
  )
    failures.push("an infinite native coordinate interval was admitted");
  for (const s of [0, 0.25, 0.5, 0.9, 1, 1.1, 1.5, 1.75, 2])
    for (const phi of [-0.3, 0, 0.7, 2.3, 7.1]) {
      const x: number = s <= 1 ? s : 2 - s;
      const expected: number[] = [
        1 + 1.5 * x - 0.5 * x ** 3,
        (s <= 1 ? 1 : -1) * (1.5 - 1.5 * x * x),
        -3 * x,
      ];
      const base: number[] = oracle(1, 2, phi);
      const q: number[][] = AutoMovieLoftPhaseSource.jet(
        AutoMovieLoftPhaseSource.station(made, s),
        phi,
      );
      const copied: number[][] = AutoMovieLoftPhaseSource.jet(
        AutoMovieLoftPhaseSource.station(structuredClone(made), s),
        phi,
      );
      const serialized: number[][] = AutoMovieLoftPhaseSource.jet(
        AutoMovieLoftPhaseSource.station(jsonCopy, s),
        phi,
      );
      for (let order: number = 0; order < 3; order++)
        for (let k: number = 0; k < 6; k++) {
          const want: number = expected[order]! * base[k]!;
          if (!nclose(q[order]![k]!, want, 1e-10 * Math.max(1, Math.abs(want))))
            failures.push(
              `natural phase jet ${s}/${phi}/${order}/${k}: ${q[order]![k]} != ${want}`,
            );
          if (
            !nclose(
              copied[order]![k]!,
              q[order]![k]!,
              64 * Number.EPSILON * Math.max(1, Math.abs(q[order]![k]!)),
            )
          )
            failures.push("numeric source copy changed geometry");
          if (
            !nclose(
              serialized[order]![k]!,
              q[order]![k]!,
              64 * Number.EPSILON * Math.max(1, Math.abs(q[order]![k]!)),
            )
          )
            failures.push("serialized source copy changed geometry");
        }
      const changed: number[][] = AutoMovieLoftPhaseSource.jet(
        AutoMovieLoftPhaseSource.station(made, s, [2, -3]),
        phi,
      );
      for (let k: number = 0; k < 6; k++)
        if (
          !nclose(changed[1]![k]!, 2 * q[1]![k]!, 1e-10) ||
          !nclose(changed[2]![k]!, 4 * q[2]![k]! - 3 * q[1]![k]!, 1e-10)
        )
          failures.push("native parameter chain rule mismatch");
    }
  if (
    typeof AutoMovieLoftPhaseSource.prepare(
      [0, 0],
      [curves[0]!, curves[0]!],
    ) !== "string"
  )
    failures.push("duplicate native coordinates admitted");
  if (
    typeof AutoMovieLoftPhaseSource.prepare(
      [0, 1],
      [curves[0]!, { quarters: [], failure: "broken native source" }],
    ) !== "string"
  )
    failures.push("failed native source selected fallback geometry");
  const danger: AutoMovieLoftPhaseSource.ISource | string =
    AutoMovieLoftPhaseSource.prepare(
      [0, 1, 2, 3],
      [1, 1, 10, 1].map(
        (r: number): AutoMovieViewConic.ICurve => ellipse(r, r).conics,
      ),
    );
  if (typeof danger === "string") failures.push(danger);
  else {
    const point: [number, number] = AutoMovieLoftPhaseSource.point(
      AutoMovieLoftPhaseSource.station(danger, 0.5),
      0,
    );
    if (!nclose(point[0], -0.35, 1e-12))
      failures.push(`off-layer natural counterexample lost: ${point[0]}`);
    console.log({
      phaseOffLayerCounterexample: {
        coordinate: 0.5,
        originalRadii: [1, 1, 10, 1],
        radius: point[0],
      },
    });
  }
}

/** Observe an expected rejection without hiding the following negative cases. */
function rejects(observe: () => unknown): boolean {
  try {
    observe();
    return false;
  } catch (error: unknown) {
    return error instanceof Error;
  }
}
