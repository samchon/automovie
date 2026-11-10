import {
  AutoMovieViewOutline,
  rootsAutoMovieViewPolynomial,
} from "@automovie/engine";
import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Fixed-chart squared-distance stations retain the original source and its parameterization.
 *
 * Scenarios:
 * 1. A straight line has its orthogonal projection at a closed-form station. Natural cubic source spans in station and both root parameters have a known degree-five distance derivative and an independently chosen interior minimum.
 * 2. The quintic r=L*q^5 has a degree-nine distance derivative under identity and both root parameters. Three length units and both ordinate signs retain the known q=1/2 station and original analytic values/jets.
 * 3. A concave parabola has a strict interior distance maximum; an osculating-circle target on r=q+q^2 gives an even stationary root without a sign change. A degree-nine polynomial with a double interior root and a seventh-order endpoint zero independently checks the shared root owner.
 * 4. Explicit partial/singleton domains retain their exact endpoints and included named knots; nonfinite targets/domains, external/reversed domains, angle parameters and unrepresentable arithmetic fail.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls public distanceStations and evaluates returned stations with the original value/jet readers, asserting source immutability and independent minima. Direct polynomial cases exercise the shared numerical owner at its new degree limit.
 * @evidence contracts/development/testing.md#independent-expectations A line projection is (s0+2*(r0-3))/5. The natural left cubic is 3s/2-s^3/2. The quintic's exact distance derivative vanishes at q=1/2 for s0=q+5q^9 or q^2+5q^8/2, reflected at the top root. The osculating target gives q^2*(3+2q); the degree-nine row is t^7*(t-1/2)^2. These closed forms do not call the candidate assembler to derive expectations.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers natural cubic/requested quintic, degree-five/nine terms, identity/both root signs, common unit changes, ordinate reflection, a non-sign-changing stationary root, knots/closed poles/clip endpoints, singleton domains, finite sorted candidates, exact source preservation and explicit unsupported/numeric failures. It establishes numerical examples rather than certified roots or moving-frame/final-skin behavior.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU unit through --include construction_source_distance; no person, renderer, native artifact, process or fixture is started.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A straight line has its orthogonal projection at a closed-form station. Natural cubic source spans in station and both root parameters...).
 */
export function test_construction_source_distance(): void {
  const failures: string[] = [];
  const line: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure =
    AutoMovieViewOutline.create({
      knots: [
        { site: "line start", station: 0, value: 3 },
        { site: "line named", station: 0.25, value: 3.5 },
        { site: "line end", station: 1, value: 5 },
      ],
    });
  if ("detail" in line) failures.push(`line preparation: ${line.detail}`);
  else {
    const candidates: number[] | string = AutoMovieViewOutline.distanceStations(
      line,
      0.2,
      4,
      [0, 1],
    );
    contains(failures, "line projection", candidates, 0.44, 2e-13);
    contains(failures, "included named knot", candidates, 0.25, 0);
    minimum(
      failures,
      "line minimum",
      line,
      candidates,
      0.2,
      4,
      (0.44 - 0.2) ** 2 + (3.88 - 4) ** 2,
      2e-13,
    );
    for (const domain of [
      [0.6, 0.9],
      [0.25, 0.25],
      [0, 0],
      [1, 1],
    ] as [number, number][]) {
      const clipped: number[] | string = AutoMovieViewOutline.distanceStations(
        line,
        0.2,
        4,
        domain,
      );
      const expected: number[] = domain[0] === domain[1] ? [domain[0]] : domain;
      if (
        typeof clipped === "string" ||
        clipped.length !== expected.length ||
        clipped.some((s: number, i: number): boolean => s !== expected[i])
      )
        failures.push(`closed partial/singleton ${domain}: ${clipped}`);
    }
    for (const domain of [
      [1, 0],
      [-1, 0.5],
      [0, 2],
      [0, Infinity],
      [NaN, 1],
    ] as [number, number][])
      if (
        typeof AutoMovieViewOutline.distanceStations(line, 0.2, 4, domain) !==
        "string"
      )
        failures.push(`invalid domain accepted: ${domain}`);
    for (const target of [
      [Infinity, 0],
      [0, NaN],
      [0, -Infinity],
    ] as [number, number][])
      if (
        typeof AutoMovieViewOutline.distanceStations(
          line,
          ...target,
          [0, 1],
        ) !== "string"
      )
        failures.push(`nonfinite target accepted: ${target}`);
  }

  const cubic: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure =
    AutoMovieViewOutline.create({
      knots: [
        { site: "natural start", station: 0, value: 0 },
        { site: "natural peak", station: 1, value: 1 },
        { site: "natural end", station: 2, value: 0 },
      ],
    });
  if ("detail" in cubic) failures.push(`natural preparation: ${cubic.detail}`);
  else {
    const target: number = -0.9765625;
    const candidates: number[] | string = AutoMovieViewOutline.distanceStations(
      cubic,
      target,
      2,
      [0, 1],
    );
    contains(
      failures,
      "natural cubic degree-five critical",
      candidates,
      0.5,
      2e-12,
    );
    minimum(
      failures,
      "natural cubic minimum",
      cubic,
      candidates,
      target,
      2,
      (0.5 - target) ** 2 + (0.6875 - 2) ** 2,
      3e-12,
    );
    const reading: AutoMovieViewOutline.IReading | string =
      AutoMovieViewOutline.at(cubic, 0.5);
    if (typeof reading === "string") failures.push(reading);
    else {
      near(
        failures,
        "original natural cubic value",
        reading.value,
        0.6875,
        2e-13,
      );
      near(
        failures,
        "original natural cubic slope",
        reading.parameterJet[0],
        1.125,
        2e-13,
      );
      near(
        failures,
        "original natural cubic curvature",
        reading.parameterJet[1],
        -1.5,
        2e-13,
      );
    }
  }

  for (const end of ["bottom", "top"] as const) {
    const source:
      | AutoMovieViewOutline.IOutline
      | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create({
      parameter: { type: "root", end, pole: end === "bottom" ? 0 : 4 },
      knots: (end === "bottom" ? [0, 1, 4] : [0, 3, 4]).map(
        (
          station: number,
          i: number,
        ): AutoMovieViewOutline.IOutline["knots"][number] => ({
          site: `natural root ${end}/${i}`,
          station,
          value: i === 1 ? 1 : 0,
        }),
      ),
    });
    if ("detail" in source) {
      failures.push(`natural root ${end}: ${source.detail}`);
      continue;
    }
    const expected: number = end === "bottom" ? 0.25 : 3.75;
    const target: number = end === "bottom" ? -1.2265625 : 5.2265625;
    const domain: [number, number] = end === "bottom" ? [0, 1] : [3, 4];
    const candidates: number[] | string = AutoMovieViewOutline.distanceStations(
      source,
      target,
      2,
      domain,
    );
    contains(
      failures,
      `natural cubic root critical ${end}`,
      candidates,
      expected,
      2e-12,
    );
    minimum(
      failures,
      `natural cubic root minimum ${end}`,
      source,
      candidates,
      target,
      2,
      (expected - target) ** 2 + (0.6875 - 2) ** 2,
      3e-12,
    );
  }

  for (const length of [0.001, 1, 1000])
    for (const sign of [-1, 1])
      for (const kind of ["station", "bottom", "top"] as const) {
        const parameter: AutoMovieConstructionOutlineParameter | undefined =
          kind === "station"
            ? undefined
            : { type: "root", end: kind, pole: kind === "bottom" ? 0 : length };
        const source:
          | AutoMovieViewOutline.IOutline
          | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create({
          ...(parameter === undefined ? {} : { parameter }),
          knots: [0, 1].map(
            (
              fraction: number,
            ): AutoMovieViewOutline.IOutline["knots"][number] => {
              const q: number = kind === "top" ? 1 - fraction : fraction;
              return {
                site: `quintic ${kind} ${fraction}`,
                station:
                  length *
                  (kind === "station" ? q : kind === "top" ? 1 - q * q : q * q),
                value: sign * length * q ** 5,
                jet: {
                  first: sign * length * (kind === "top" ? -1 : 1) * 5 * q ** 4,
                  second: sign * length * 20 * q ** 3,
                },
              };
            },
          ),
        });
        if ("detail" in source) {
          failures.push(`quintic ${kind}/${length}/${sign}: ${source.detail}`);
          continue;
        }
        const before: string = JSON.stringify(source);
        const expected: number =
          length * (kind === "station" ? 0.5 : kind === "top" ? 0.75 : 0.25);
        const target: number =
          length *
          (kind === "station"
            ? 0.5 + 5 / 512
            : kind === "top"
              ? 0.75 - 2.5 / 256
              : 0.25 + 2.5 / 256);
        const candidates: number[] | string =
          AutoMovieViewOutline.distanceStations(source, target, 0, [0, length]);
        contains(
          failures,
          `quintic degree-nine ${kind}/${length}/${sign}`,
          candidates,
          expected,
          3e-11 * length,
        );
        contains(failures, "closed start", candidates, 0, 0);
        contains(failures, "closed end", candidates, length, 0);
        if (
          typeof candidates !== "string" &&
          candidates.some(
            (s: number, i: number): boolean =>
              s < 0 || s > length || (i > 0 && s <= candidates[i - 1]!),
          )
        )
          failures.push(`unsorted/outside candidates: ${candidates}`);
        for (const q of [0, 0.2, 0.5, 0.8, 1]) {
          const station: number =
            length *
            (kind === "station" ? q : kind === "top" ? 1 - q * q : q * q);
          const reading: AutoMovieViewOutline.IReading | string =
            AutoMovieViewOutline.at(source, station);
          if (typeof reading === "string") {
            failures.push(`source reading: ${reading}`);
            continue;
          }
          near(
            failures,
            "unchanged quintic value",
            reading.value,
            sign * length * q ** 5,
            2e-12 * length,
          );
          near(
            failures,
            "original parameter first jet",
            reading.parameterJet[0],
            sign *
              (kind === "station"
                ? 5 * q ** 4
                : (kind === "top" ? -1 : 1) * Math.sqrt(length) * 5 * q ** 4),
            2e-11 * Math.max(length, Math.sqrt(length)),
          );
          near(
            failures,
            "original parameter second jet",
            reading.parameterJet[1],
            sign * (kind === "station" ? (20 * q ** 3) / length : 20 * q ** 3),
            2e-10 / Math.min(1, length),
          );
        }
        if (JSON.stringify(source) !== before)
          failures.push("distance query changed the original prepared source");
      }

  const osculating:
    | AutoMovieViewOutline.IOutline
    | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create({
    knots: [-0.5, 0.5].map(
      (q: number): AutoMovieViewOutline.IOutline["knots"][number] => ({
        site: `parabola ${q}`,
        station: q + 0.5,
        value: q + q * q,
        jet: { first: 1 + 2 * q, second: 2 },
      }),
    ),
  });
  if ("detail" in osculating)
    failures.push(`osculating preparation: ${osculating.detail}`);
  else
    contains(
      failures,
      "even distance stationary root",
      AutoMovieViewOutline.distanceStations(osculating, -0.5, 1, [0, 1]),
      0.5,
      2e-11,
    );
  const dome: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure =
    AutoMovieViewOutline.create({
      knots: [-0.5, 0.5].map(
        (q: number): AutoMovieViewOutline.IOutline["knots"][number] => ({
          site: `dome ${q}`,
          station: q + 0.5,
          value: 1 - q * q,
          jet: { first: -2 * q, second: -2 },
        }),
      ),
    });
  if ("detail" in dome) failures.push(`dome preparation: ${dome.detail}`);
  else {
    const candidates: number[] | string = AutoMovieViewOutline.distanceStations(
      dome,
      0.5,
      -1,
      [0, 1],
    );
    contains(failures, "interior distance maximum", candidates, 0.5, 2e-12);
    if (typeof candidates !== "string") {
      const values: number[] = candidates.map((s: number): number => {
        const value: number | string = AutoMovieViewOutline.value(dome, s);
        return typeof value === "number"
          ? (s - 0.5) ** 2 + (value + 1) ** 2
          : NaN;
      });
      near(
        failures,
        "strict interior distance maximum value",
        Math.max(...values),
        4,
        2e-12,
      );
    }
  }
  contains(
    failures,
    "degree-nine even polynomial root",
    rootsAutoMovieViewPolynomial([0, 0, 0, 0, 0, 0, 0, 0.25, -1, 1]),
    0.5,
    2e-11,
  );
  for (const coefficients of [[], [0], [7], [0, 1], [-1, 1]])
    if (rootsAutoMovieViewPolynomial(coefficients).length !== 0)
      failures.push(
        `constant/endpoint polynomial invented interior root: ${coefficients}`,
      );
  for (const coefficients of [
    [NaN],
    [Infinity],
    new Array<number>(11).fill(1),
  ]) {
    let rejected: boolean = false;
    try {
      rootsAutoMovieViewPolynomial(coefficients);
    } catch (error) {
      rejected = error instanceof RangeError;
    }
    if (!rejected)
      failures.push(`unsupported polynomial accepted: ${coefficients}`);
  }
  const angle: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure =
    AutoMovieViewOutline.create({
      parameter: { type: "angle", bottom: 0, top: 1 },
      knots: [
        { site: "angle start", station: 0, value: 1 },
        { site: "angle end", station: 1, value: 2 },
      ],
    });
  if (
    "detail" in angle ||
    typeof AutoMovieViewOutline.distanceStations(angle, 0, 0, [0, 1]) !==
      "string"
  )
    failures.push("angle source did not fail explicitly");
  const huge: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure =
    AutoMovieViewOutline.create({
      knots: [
        { site: "huge start", station: 0, value: Number.MAX_VALUE },
        { site: "huge end", station: 1, value: Number.MAX_VALUE },
      ],
    });
  if (
    "detail" in huge ||
    typeof AutoMovieViewOutline.distanceStations(
      huge,
      0,
      -Number.MAX_VALUE,
      [0, 1],
    ) !== "string"
  )
    failures.push(
      "unrepresentable target displacement did not fail explicitly",
    );
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} source distance findings:\n${failures.join("\n")}`,
    );
}

/** Require a finite numerical candidate at a closed-form station; extra residual observations are permitted. */
function contains(
  failures: string[],
  label: string,
  candidates: number[] | string,
  expected: number,
  tolerance: number,
): void {
  try {
    TestValidator.predicate(
      label,
      typeof candidates !== "string" &&
        candidates.length !== 0 &&
        candidates.every(Number.isFinite) &&
        candidates.some((s: number): boolean => nclose(s, expected, tolerance)),
    );
  } catch {
    failures.push(`${label}: ${candidates}, expected ${expected}`);
  }
}

/** Compare a source-derived candidate minimum with an independently known squared distance. */
function minimum(
  failures: string[],
  label: string,
  source: AutoMovieViewOutline.IOutline,
  candidates: number[] | string,
  targetStation: number,
  targetValue: number,
  expected: number,
  tolerance: number,
): void {
  if (typeof candidates === "string") {
    failures.push(`${label}: ${candidates}`);
    return;
  }
  const values: number[] = candidates.map((station: number): number => {
    const value: number | string = AutoMovieViewOutline.value(source, station);
    return typeof value === "number"
      ? (station - targetStation) ** 2 + (value - targetValue) ** 2
      : NaN;
  });
  near(failures, label, Math.min(...values), expected, tolerance);
}

/** A finite absolute-error predicate keeps NaN from satisfying a source comparison. */
function near(
  failures: string[],
  label: string,
  actual: number,
  expected: number,
  tolerance: number,
): void {
  try {
    TestValidator.predicate(label, nclose(actual, expected, tolerance));
  } catch {
    failures.push(`${label}: ${actual}, expected ${expected}`);
  }
}
