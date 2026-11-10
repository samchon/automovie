import {
  AutoMovieConicArc,
  AutoMovieConicHermite,
  type AutoMoviePolarSector,
  AutoMovieViewConic,
  AutoMovieViewSection,
} from "@automovie/engine";

import { ConstructionConicOracle } from "../../internal/construction/ConstructionConicOracle";
import { ConstructionViewOracle } from "../../internal/construction/ConstructionViewOracle";

/**
 * The source section preserves compatible conics and bounds its convex G2 approximation on incompatible ends.
 *
 * Scenarios:
 * 1. Forty-two ellipse cases cover aspects 1/2/4/8/16/32/64, reciprocal orientations and three length scales. Their radius, first/second angular derivatives, implicit equation and perimeter have independent closed-form expectations.
 * 2. General rational shoulders and native endpoint/interior parameters satisfy the implicit conic and its independently differentiated polar jets, including thin reciprocal quarters.
 * 3. Asymmetric quarters retain exact support/shoulder points and shared guide jets. Cases include the unchanged near-ellipse trunk, eighteen ear boxes and seven nearly symmetric toe boxes reported by actual consumers, at three scales. Samples inside every rational G2 end, at its boundary and outside it obey the same-ray point-error envelope and remain convex. Independent Taylor arithmetic checks native derivatives and independently specified endpoint curvatures check preparation.
 * 4. Zero/nonfinite extents, zero weights, nonpositive shared curvature and nonfinite queries remain explicit failures; no fallback source is accepted.
 * 5. The complete section path, including girth and fault admission, is observed on the asymmetric cases. Actual range endpoints and solved requests must have finite arclength, no source fault and a measured girth residual within 1e-6. Circle inputs differing by a few ulps remain admitted; extremely unequal positive end weights retain at least their geometric chord length.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Exercises ConicArc, prepared ViewConic and production ViewSection, including complete of/fault/range/solve with actual residual admission. The separate phase_fidelity test owns final phase conversion; this unit generates no Human or render.
 * @evidence contracts/development/testing.md#independent-expectations Ellipse jets differentiate F=cos(phi)^2/a^2+sin(phi)^2/b^2; its perimeter uses the independent AGM oracle. General conic jets differentiate (X+Y-1)^2=4w^2(1-X)(1-Y), with native Bernstein points supplying only query locations. The G2 end's independent same-ray error bound is4T^2*hypot(a,b), and its start curvature is the specified smaller adjacent rational curvature. A power-series rational quotient checks native evaluation without copying preparation weights. The implicit source checks the far endpoint curvature.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers the complete 42-case production counterexample family, non-ellipse weights, three scales, asymmetric endpoint curvature changes, exact support/shoulder ownership, narrow correction supports and explicit invalid inputs. Finite/count checks precede numerical comparisons; actual nearly compatible inputs additionally require strictly ordered observations and one cardinal guide each.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous synthetic CPU unit through --include construction_source_conic; creates no person, viewer, process or fixture and observes the production source evaluator.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Forty-two ellipse cases cover aspects 1/2/4/8/16/32/64, reciprocal orientations and three length scales. Their radius, first/second...).
 */
export function test_construction_source_conic(): void {
  const failures: string[] = [];
  const E: number = Math.SQRT2 - 1;
  failures.push(...ConstructionConicOracle.fourthChecks());
  for (const aspect of [1, 2, 4, 8, 16, 32, 64])
    for (const swap of [false, true])
      for (const scale of [0.001, 1, 1000]) {
        const a: number = scale * (swap ? aspect : 1);
        const b: number = scale * (swap ? 1 : aspect);
        const label: string = `ellipse ${aspect}/${swap}/${scale}`;
        const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of(
          { extents: [a, b, a, b] },
          [E, E, E, E],
        );
        if (section.conics.failure !== null) {
          failures.push(`${label}: ${section.conics.failure}`);
          continue;
        }
        for (let i: number = 0; i < 512; i++) {
          const phi: number = (2 * Math.PI * (i + 0.37)) / 512;
          const expected: AutoMoviePolarSector.Jet =
            ConstructionConicOracle.ellipse(a, b, phi);
          ConstructionConicOracle.compare(
            failures,
            label,
            AutoMovieViewSection.radius(section, phi),
            expected,
            scale,
            2e-9,
          );
        }
        const perimeter: number = ConstructionViewOracle.perimeter(a, b);
        if (
          !Number.isFinite(section.girth) ||
          Math.abs(section.girth - perimeter) >
            1e-7 + 256 * Number.EPSILON * perimeter
        )
          failures.push(`${label}: girth ${section.girth}, AGM ${perimeter}`);
        if (
          section.box.extents.some(
            (value: number, g: number): boolean =>
              value !== (g % 2 === 0 ? a : b),
          ) ||
          section.shoulders.some((r: number): boolean => r !== E)
        )
          failures.push(`${label}: source input changed`);
      }

  // Native Bernstein points and implicit differentiation do not reuse the source's ray inverse or quotient jets.
  for (const [a, b] of [
    [1, 1],
    [1, 64],
    [64, 1],
    [3, 7],
  ])
    for (const r of [0.05, 0.2, E, 0.65, 0.9])
      for (const scale of [0.001, 1, 1000]) {
        for (const t of [0, 1e-6, 0.01, 0.2, 0.5, 0.8, 0.99, 1 - 1e-6, 1]) {
          const point: [number, number] = ConstructionConicOracle.native(
            a! * scale,
            b! * scale,
            r,
            t,
          );
          const phi: number =
            t === 1 ? Math.PI / 2 : Math.atan2(point[1], point[0]);
          const expected: AutoMoviePolarSector.Jet =
            ConstructionConicOracle.implicit(a! * scale, b! * scale, r, point);
          ConstructionConicOracle.compare(
            failures,
            `native ${a}/${b}/${r}/${scale}/${t}`,
            AutoMovieConicArc.radius(a! * scale, b! * scale, r, phi),
            expected,
            scale,
            2e-8,
          );
        }
      }

  const cases: ReturnType<typeof ConstructionConicOracle.cases> =
    ConstructionConicOracle.cases();
  for (const { extents: base, shoulders } of cases)
    for (const scale of [0.001, 1, 1000]) {
      const e: [number, number, number, number] = base.map(
        (x: number): number => x * scale,
      ) as [number, number, number, number];
      const expectedCurvatures: number[] = e.map(
        (value: number, g: number): number =>
          Math.min(
            ConstructionConicOracle.endpoint(
              value,
              e[(g + 3) % 4]!,
              shoulders[(g + 3) % 4]!,
            ),
            ConstructionConicOracle.endpoint(
              value,
              e[(g + 1) % 4]!,
              shoulders[g]!,
            ),
          ),
      );
      const curvatures: number[] = AutoMovieViewSection.curvatures(
        { extents: e },
        shoulders,
      );
      if (
        curvatures.length !== 4 ||
        curvatures.some(
          (value: number, g: number): boolean =>
            !Number.isFinite(value) ||
            Math.abs(value - expectedCurvatures[g]!) >
              64 * Number.EPSILON * expectedCurvatures[g]!,
        )
      )
        failures.push(`guide curvature law ${base}/${scale}: ${curvatures}`);
      const curve: AutoMovieViewConic.ICurve = AutoMovieViewConic.create(
        e,
        shoulders,
        curvatures,
      );
      if (curve.failure !== null || curve.quarters.length !== 4) {
        failures.push(
          `asymmetric ${base}/${scale}: ${curve.failure}, count ${curve.quarters.length}`,
        );
        continue;
      }
      const complete: AutoMovieViewSection.ISection = AutoMovieViewSection.of(
        { extents: e },
        shoulders,
      );
      const fault: string | null = AutoMovieViewSection.fault(complete);
      if (
        fault !== null ||
        !Number.isFinite(complete.girth) ||
        !(complete.girth > 0)
      )
        failures.push(
          `complete section ${base}/${scale}: ${fault}, girth ${complete.girth}`,
        );
      if (
        complete.knots.some(
          (knot: AutoMoviePolarSector.IGuide, i: number): boolean =>
            !Number.isFinite(knot.angle) ||
            knot.angle < 0 ||
            knot.angle >= 2 * Math.PI ||
            (i > 0 && knot.angle <= complete.knots[i - 1]!.angle),
        )
      )
        failures.push(`ordered observations ${base}/${scale}`);
      for (let q: number = 0; q < 4; q++) {
        const arc: AutoMovieViewConic.IQuarter = curve.quarters[q]!;
        const a: number = e[q]!;
        const b: number = e[(q + 1) % 4]!;
        const start: number = (q * Math.PI) / 2;
        if (
          complete.knots.filter(
            (knot: AutoMoviePolarSector.IGuide): boolean =>
              knot.angle === start,
          ).length !== 1
        )
          failures.push(`unique guide observation ${base}/${scale}/${q}`);
        ConstructionConicOracle.compare(
          failures,
          `support ${q}`,
          AutoMovieViewConic.radius(curve, start),
          [a, 0, a - a * a * curvatures[q]!],
          scale,
          1e-12,
        );
        const shoulder: number = Math.atan2(b, a);
        const shoulderRadius: number =
          (Math.hypot(a, b) * (1 + shoulders[q]!)) / 2;
        const shoulderJet: AutoMoviePolarSector.Jet = AutoMovieViewConic.radius(
          curve,
          start + shoulder,
        );
        if (
          !Number.isFinite(shoulderJet[0]) ||
          Math.abs(shoulderJet[0] - shoulderRadius) >
            256 * Number.EPSILON * Math.max(a, b)
        )
          failures.push(
            `shoulder ${base}/${scale}/${q}: ${shoulderJet[0]}, expected ${shoulderRadius}`,
          );
        const angles: number[] = Array.from(
          { length: 65 },
          (_: unknown, i: number): number => ((i + 0.1) * Math.PI) / 2 / 65,
        );
        for (const [patch, reverse] of [
          [arc.start, false],
          [arc.end, true],
        ] as const) {
          if (patch === null) continue;
          if (scale === 1 && shoulders[0] > 0.48 && shoulders[0] < 0.53) {
            const fourth: number = ConstructionConicOracle.fourth(patch);
            if (!Number.isFinite(fourth))
              failures.push("nonfinite fourth derivative observation");
            console.log("source conic fixed-step scale:", {
              box: base,
              q,
              reverse,
              angle: patch.angle,
              fourth,
              hSquaredFourth: 1e-10 * fourth,
            });
          }
          const first: [number, number, number, number, number, number] =
            AutoMovieConicHermite.jet(patch, 0);
          const last: [number, number, number, number, number, number] =
            AutoMovieConicHermite.jet(patch, 1);
          const x: number = reverse ? b : a;
          const y: number = reverse ? a : b;
          const shared: number = curvatures[(q + (reverse ? 1 : 0)) % 4]!;
          const point: [number, number] = ConstructionConicOracle.native(
            x,
            y,
            shoulders[q]!,
            patch.native,
          );
          const endJet: AutoMoviePolarSector.Jet =
            ConstructionConicOracle.implicit(x, y, shoulders[q]!, point);
          const endTurn: number =
            endJet[0] ** 2 + 2 * endJet[1] ** 2 - endJet[0] * endJet[2];
          const endCurvature: number =
            endTurn / Math.hypot(endJet[0], endJet[1]) ** 3;
          for (const [actual, expected] of [
            [ConstructionConicOracle.curvature(first), shared],
            [ConstructionConicOracle.curvature(last), endCurvature],
          ])
            if (
              !Number.isFinite(actual) ||
              Math.abs(actual! - expected!) >
                2e-8 * Math.max(1 / scale, Math.abs(expected!))
            )
              failures.push(
                `G2 endpoint curvature ${base}/${scale}/${q}/${reverse}: ${actual}, expected ${expected}`,
              );
          for (const t of [0, 0.0001, 0.1, 0.5, 0.9, 1]) {
            const expected: [number, number, number, number, number, number] =
              ConstructionConicOracle.rational(patch, t);
            const actual: [number, number, number, number, number, number] =
              AutoMovieConicHermite.jet(patch, t);
            for (let k: number = 0; k < 6; k++)
              if (
                !Number.isFinite(actual[k]) ||
                Math.abs(actual[k]! - expected[k]!) >
                  2e-8 * Math.max(scale, Math.abs(expected[k]!))
              )
                failures.push(
                  `rational Taylor jet ${base}/${scale}/${q}/${reverse}/${t}/${k}`,
                );
            const local: number = Math.atan2(expected[1], expected[0]);
            if (local > 0 && local < patch.angle) {
              const radial: AutoMoviePolarSector.Jet =
                AutoMovieConicHermite.radius(patch, local);
              if (
                !Number.isFinite(radial[0]) ||
                Math.abs(radial[0] - Math.hypot(expected[0], expected[1])) >
                  2e-8 * scale
              )
                failures.push(
                  "G2 ray does not pass its independent rational point",
                );
              angles.push(reverse ? Math.PI / 2 - local : local);
            }
          }
          for (const fraction of [0.01, 0.1, 0.4, 0.8, 1, 1.01])
            angles.push(
              reverse
                ? Math.PI / 2 - patch.angle * fraction
                : patch.angle * fraction,
            );
        }
        for (const phi of angles) {
          const jet: AutoMoviePolarSector.Jet = AutoMovieViewConic.radius(
            curve,
            start + phi,
          );
          const source: AutoMoviePolarSector.Jet = AutoMovieConicArc.radius(
            a,
            b,
            shoulders[q]!,
            phi,
          );
          const budget: number =
            1e-7 * Math.min(a, b) + 512 * Number.EPSILON * Math.max(a, b);
          const turn: number = jet[0] ** 2 + 2 * jet[1] ** 2 - jet[0] * jet[2];
          const allowance: number =
            256 *
            Number.EPSILON *
            (jet[0] ** 2 + 2 * jet[1] ** 2 + Math.abs(jet[0] * jet[2]));
          if (
            jet.length !== 3 ||
            ![...jet, ...source, turn].every(Number.isFinite) ||
            Math.abs(jet[0] - source[0]) > budget ||
            turn < -allowance
          )
            failures.push(
              `correction ${base}/${scale}/${q}/${phi}: ${jet}, source ${source}, N ${turn}`,
            );
        }
      }
    }

  for (const [e, r, k] of [
    [
      [0, 1, 1, 1],
      [E, E, E, E],
      [1, 1, 1, 1],
    ],
    [
      [1, 1, 1, 1],
      [0, E, E, E],
      [1, 1, 1, 1],
    ],
    [
      [1, 1, 1, 1],
      [E, E, E, E],
      [0, 1, 1, 1],
    ],
    [
      [Infinity, 1, 1, 1],
      [E, E, E, E],
      [1, 1, 1, 1],
    ],
  ]) {
    const failed: AutoMovieViewConic.ICurve = AutoMovieViewConic.create(
      e!,
      r!,
      k!,
    );
    if (
      failed.failure === null ||
      failed.quarters.length !== 0 ||
      AutoMovieViewConic.radius(failed, 0).some(Number.isFinite)
    )
      failures.push("invalid source became a usable curve");
  }
  const circleCurvatures: number[] = AutoMovieViewSection.curvatures(
    { extents: [1, 1, 1, 1] },
    [E, E, E, E],
  );
  const circle: AutoMovieViewConic.ICurve = AutoMovieViewConic.create(
    [1, 1, 1, 1],
    [E, E, E, E],
    circleCurvatures,
  );
  if (circle.failure !== null || circle.quarters.length !== 4)
    failures.push(`finite circle fixture failed: ${circle.failure}`);
  if (AutoMovieViewConic.radius(circle, NaN).some(Number.isFinite))
    failures.push("nonfinite query became a finite curve reading");

  const pointWeight: number = (2 * Math.SQRT1_2 - 1) / (2 * (1 - Math.SQRT1_2));
  for (const r of [
    pointWeight / (1 + pointWeight),
    E - Number.EPSILON,
    E + Number.EPSILON,
  ]) {
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of(
      { extents: [10, 10, 10, 10] },
      [r, E, E, r],
    );
    if (
      AutoMovieViewSection.fault(section) !== null ||
      !AutoMovieViewSection.radius(section, Math.PI / 4).every(Number.isFinite)
    )
      failures.push(
        `near-compatible circle rejected at shoulder ${r}: ${section.conics.failure}`,
      );
  }

  // The raw middle is an exact unit-circle arc. Every substituted end must
  // add at least its chord, regardless of an arbitrarily concentrated native
  // speed. A coarse/half quadrature can miss both positive-weight end layers.
  const weighted: AutoMovieViewConic.ICurve = AutoMovieViewConic.create(
    [1, 1, 1, 1],
    [E, E, E, E],
    [1e-60, 1e-60, 1e-60, 1e-60],
  );
  if (weighted.failure !== null)
    failures.push(`weighted end fixture: ${weighted.failure}`);
  else {
    const section: AutoMovieViewSection.ISection = {
      ...AutoMovieViewSection.bare({ extents: [1, 1, 1, 1] }, [E, E, E, E]),
      conics: weighted,
    };
    const patch: AutoMovieConicHermite.IPatch = weighted.quarters[0]!.start!;
    const endpoint: [number, number] = ConstructionConicOracle.native(
      1,
      1,
      E,
      patch.native,
    );
    const lower: number =
      2 * Math.PI -
      8 * Math.atan2(endpoint[1], endpoint[0]) +
      8 * Math.hypot(1 - endpoint[0], endpoint[1]);
    const length: number = AutoMovieViewSection.length(section);
    if (
      !(
        Number.isFinite(length) &&
        length >= lower - 1e-7 &&
        length <= 2 * Math.PI + 1e-7
      )
    )
      failures.push(`weighted-end length ${length}, geometric lower ${lower}`);
  }

  // Exercise the source's actual solve instead of crediting its
  // primitive radius tests as a complete section or girth result.
  for (const extents of [
    [30, 20, 30, 20],
    [30, 12, 18, 25],
    [12, 40, 20, 8],
  ] as [number, number, number, number][]) {
    for (const departures of [
      [0, 0, 0, 0],
      [0.02, -0.01, 0.01, -0.02],
    ] as [number, number, number, number][]) {
      const box: AutoMovieViewSection.IBox = { extents };
      const reach: AutoMovieViewSection.IRange | null =
        AutoMovieViewSection.range(box, departures);
      if (reach === null) {
        failures.push(
          `source girth reach ${extents}/${departures}: no finite range`,
        );
        continue;
      }
      let previous: number = -Infinity;
      for (let i: number = 0; i <= 16; i++) {
        const common: number =
          reach.shoulder[0] +
          (i * (reach.shoulder[1] - reach.shoulder[0])) / 16;
        const shoulders: [number, number, number, number] = departures.map(
          (departure: number): number => common + departure,
        ) as [number, number, number, number];
        const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of(
          box,
          shoulders,
        );
        const fault: string | null = AutoMovieViewSection.fault(section);
        if (fault !== null || !(section.girth > previous))
          failures.push(
            `source girth family ${extents}/${departures}/${i}: fault ${fault}, girth ${section.girth} after ${previous}`,
          );
        previous = section.girth;
        if (i % 4 !== 0) continue;
        const solved: AutoMovieViewSection.ISolved = AutoMovieViewSection.solve(
          "analytic conic",
          box,
          section.girth,
          departures,
        );
        if (
          solved.section === null ||
          solved.diagnostics.length !== 0 ||
          !Number.isFinite(solved.section.girth) ||
          Math.abs(solved.section.girth - section.girth) > 1e-6 ||
          AutoMovieViewSection.fault(solved.section) !== null
        )
          failures.push(
            `source girth residual ${extents}/${departures}/${i}: target ${section.girth}, result ${solved.section?.girth}, diagnostics ${JSON.stringify(solved.diagnostics)}`,
          );
      }
    }
  }
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} source conic findings:\n${failures.join("\n")}`,
    );
}
