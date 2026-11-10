import {
  AutoMovieViewOutline,
  rootsAutoMovieViewSinPolynomial,
} from "@automovie/engine";
import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";

/**
 * Fixed-chart affine-origin support candidates preserve the original scalar and its pole parameter.
 *
 * Scenarios:
 * 1. A closed two-pole quadratic in theta has its unique affine-plus-source maximum at pi/3 or 2pi/3. Three unit scales, both signs and partial domains retain exact source endpoints/knots and analytically known critical stations.
 * 2. A linear theta source plus physical station has two critical points at pi/6 and 5pi/6, which scalar-only critical stations omit. A quintic source gives a sixth-multiplicity derivative zero at the middle of the angular domain.
 * 3. Identity and both single-root parameters reduce to the existing polynomial owner, including constant/zero functions. Nearby sine roots and exact endpoint roots exercise bracket boundaries without treating finite root candidates as interval certificates.
 * 4. Reversed, external, singleton or nonfinite domains and unrepresentable term combinations fail explicitly.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public original-source support API, evaluates its candidates through the same source value API and checks unchanged source inputs; directly exercises the bounded sine-polynomial root owner at multiple-root and bracket boundaries.
 * @evidence contracts/development/testing.md#independent-expectations Critical stations follow the exact inverse s=L*sin(theta/2)^2 and independently differentiated polynomials. The unique closed-source maximum solves pi-2theta+A*sin(theta)=0 at the authored theta; sin(theta)-1/2 has roots pi/6 and 5pi/6. The quintic integrates minus the fourth-order cosine Taylor polynomial, so its remaining derivative has a sixth-multiplicity zero at pi/2.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers cubic and quintic preparation, identity/root/angle mappings, both coefficient signs, zero terms, three length units, closed poles, partial source spans, stationary tangency, nearby simple roots, endpoint roots and malformed/numerically unrepresentable inputs. It asserts finite counts/values before tolerance comparisons and does not test a moving frame or final loft envelope.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous synthetic CPU unit through --include construction_affine_support, with no Human generation, fixtures, renderer or process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A closed two-pole quadratic in theta has its unique affine-plus-source maximum at pi/3 or 2pi/3. Three unit scales, both signs and partial...).
 */
export function test_construction_affine_support(): void {
  const failures: string[] = [];
  for (const length of [0.001, 1, 1000]) {
    const source:
      | AutoMovieViewOutline.IOutline
      | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
      {
        knots: [0, 0.5, 1].map(
          (
            fraction: number,
          ): AutoMovieViewOutline.IOutline["knots"][number] => ({
            site: `closed ${fraction}`,
            station: length * Math.sin((fraction * Math.PI) / 2) ** 2,
            value: length * fraction * (1 - fraction) * Math.PI ** 2,
            jet: {
              first: length * (1 - 2 * fraction) * Math.PI ** 2,
              second: -2 * length * Math.PI ** 2,
            },
          }),
        ),
      },
      { bottom: 0, top: length },
    );
    if ("detail" in source) {
      failures.push(`closed ${length}: ${source.detail}`);
      continue;
    }
    const before: string = JSON.stringify(source.knots);
    for (const sign of [-1, 1]) {
      const theta: number = sign < 0 ? Math.PI / 3 : (2 * Math.PI) / 3;
      const slope: number = (2 * (2 * theta - Math.PI)) / Math.sin(theta);
      const station: number = length * Math.sin(theta / 2) ** 2;
      const candidates: number[] | string =
        AutoMovieViewOutline.supportStations(source, slope);
      contains(
        failures,
        `closed critical ${length}/${sign}`,
        candidates,
        station,
        2e-11 * length,
      );
      if (typeof candidates !== "string") {
        const expected: number =
          slope * station + length * theta * (Math.PI - theta);
        const values: number[] = candidates.map((s: number): number => {
          const value: number | string = AutoMovieViewOutline.value(source, s);
          return typeof value === "number" ? slope * s + value : NaN;
        });
        near(
          failures,
          `closed maximum ${length}/${sign}`,
          Math.max(...values),
          expected,
          2e-11 * length,
        );
        contains(failures, "closed bottom", candidates, 0, 0);
        contains(failures, "closed top", candidates, length, 0);
        const negative: number[] | string =
          AutoMovieViewOutline.supportStations(source, -slope, -1);
        contains(
          failures,
          `negative scalar ${length}/${sign}`,
          negative,
          station,
          2e-11 * length,
        );
      }
      const clipped: number[] | string = AutoMovieViewOutline.supportStations(
        source,
        slope,
        1,
        [station / 2, station * 0.75],
      );
      const expectedCuts: number[] = [
        station / 2,
        ...source.knots
          .map(
            (k: AutoMovieViewOutline.IOutline["knots"][number]): number =>
              k.station,
          )
          .filter(
            (s: number): boolean => s > station / 2 && s < station * 0.75,
          ),
        station * 0.75,
      ];
      if (
        typeof clipped === "string" ||
        clipped.length !== expectedCuts.length ||
        !clipped.every(Number.isFinite) ||
        clipped.some((s: number, i: number): boolean => s !== expectedCuts[i])
      )
        failures.push(
          `partial domain ${length}/${sign}: ${clipped}, expected ${expectedCuts}`,
        );
    }
    if (JSON.stringify(source.knots) !== before)
      failures.push("support changed its prepared input");

    const angle: AutoMovieConstructionOutlineParameter = {
      type: "angle",
      bottom: 0,
      top: length,
    };
    const linear:
      | AutoMovieViewOutline.IOutline
      | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create({
      parameter: angle,
      knots: [
        { site: "linear start", station: 0, value: 0 },
        { site: "linear end", station: length, value: (-length * Math.PI) / 4 },
      ],
    });
    if ("detail" in linear) failures.push(`linear angle: ${linear.detail}`);
    else {
      const candidates: number[] | string =
        AutoMovieViewOutline.supportStations(linear, 1);
      for (const theta of [Math.PI / 6, (5 * Math.PI) / 6])
        contains(
          failures,
          `two sine roots ${length}`,
          candidates,
          length * Math.sin(theta / 2) ** 2,
          2e-11 * length,
        );
    }
  }

  const middle: number = Math.PI / 2;
  const primitive: (x: number) => number = (x: number): number =>
    -x + x ** 3 / 6 - x ** 5 / 120;
  const first: (x: number) => number = (x: number): number =>
    -1 + (x * x) / 2 - x ** 4 / 24;
  const second: (x: number) => number = (x: number): number => x - x ** 3 / 6;
  const quintic: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure =
    AutoMovieViewOutline.create({
      parameter: { type: "angle", bottom: 0, top: 2 },
      knots: [-middle, middle].map(
        (
          x: number,
          i: number,
        ): AutoMovieViewOutline.IOutline["knots"][number] => ({
          site: `quintic ${i}`,
          station: 2 * i,
          value: primitive(x),
          jet: { first: Math.PI * first(x), second: Math.PI ** 2 * second(x) },
        }),
      ),
    });
  if ("detail" in quintic) failures.push(`quintic source: ${quintic.detail}`);
  else
    contains(
      failures,
      "sixth-multiplicity source critical",
      AutoMovieViewOutline.supportStations(quintic, 1),
      1,
      2e-9,
    );

  for (const end of ["bottom", "top"] as const) {
    const source:
      | AutoMovieViewOutline.IOutline
      | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create({
      parameter: { type: "root", end, pole: end === "bottom" ? 0 : 4 },
      knots: [0, 1, 4].map(
        (s: number): AutoMovieViewOutline.IOutline["knots"][number] => {
          const x: number = end === "bottom" ? Math.sqrt(s) : -Math.sqrt(4 - s);
          return {
            site: `root ${s}`,
            station: s,
            value: -((x - (end === "bottom" ? 1 : -1)) ** 2),
            jet: { first: -4 * (x - (end === "bottom" ? 1 : -1)), second: -8 },
          };
        },
      ),
    });
    if ("detail" in source)
      failures.push(`single root ${end}: ${source.detail}`);
    else {
      contains(
        failures,
        `single root scalar ${end}`,
        AutoMovieViewOutline.supportStations(source, 0),
        end === "bottom" ? 1 : 3,
        1e-10,
      );
      contains(
        failures,
        `single root affine ${end}`,
        AutoMovieViewOutline.supportStations(source, end === "bottom" ? -1 : 1),
        end === "bottom" ? 0.25 : 3.75,
        1e-10,
      );
    }
  }
  const identity:
    | AutoMovieViewOutline.IOutline
    | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create({
    knots: [
      { site: "identity start", station: 0, value: 0 },
      { site: "identity end", station: 2, value: 2 },
    ],
  });
  if ("detail" in identity)
    failures.push(`identity fixture: ${identity.detail}`);
  else {
    const constant: number[] | string = AutoMovieViewOutline.supportStations(
      identity,
      -1,
    );
    if (
      typeof constant === "string" ||
      constant.length !== 2 ||
      constant[0] !== 0 ||
      constant[1] !== 2
    )
      failures.push(`constant function candidates: ${constant}`);
    const zero: number[] | string = AutoMovieViewOutline.supportStations(
      identity,
      0,
      0,
    );
    if (typeof zero === "string" || zero.length !== 2)
      failures.push(`zero function candidates: ${zero}`);
    for (const domain of [
      [1, 1],
      [2, 0],
      [-1, 1],
      [0, 3],
      [0, Infinity],
    ] as [number, number][])
      if (
        typeof AutoMovieViewOutline.supportStations(identity, 1, 1, domain) !==
        "string"
      )
        failures.push(`invalid support domain accepted: ${domain}`);
    if (
      typeof AutoMovieViewOutline.supportStations(identity, Infinity) !==
      "string"
    )
      failures.push("nonfinite affine coefficient accepted");
  }
  const cubic: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure =
    AutoMovieViewOutline.create({
      knots: [
        { site: "cubic start", station: 0, value: 0 },
        { site: "cubic peak", station: 1, value: 1 },
        { site: "cubic end", station: 2, value: 0 },
      ],
    });
  if ("detail" in cubic)
    failures.push(`natural cubic fixture: ${cubic.detail}`);
  else {
    // The right natural span is 1-3u^2/2+u^3/2; adding s/2 gives u=1-sqrt(2/3).
    contains(
      failures,
      "nonzero natural cubic support",
      AutoMovieViewOutline.supportStations(cubic, 0.5),
      2 - Math.sqrt(2 / 3),
      1e-12,
    );
    contains(
      failures,
      "negative natural cubic support",
      AutoMovieViewOutline.supportStations(cubic, -0.5, -1),
      2 - Math.sqrt(2 / 3),
      1e-12,
    );
  }
  for (const distance of [0.1, 0.001, 0.00001]) {
    const roots: number[] | string = rootsAutoMovieViewSinPolynomial(
      [-Math.cos(distance)],
      0,
      Math.PI,
      1,
    );
    contains(
      failures,
      `nearby sine left ${distance}`,
      roots,
      0.5 - distance / Math.PI,
      2e-10,
    );
    contains(
      failures,
      `nearby sine right ${distance}`,
      roots,
      0.5 + distance / Math.PI,
      2e-10,
    );
  }
  const endpoint: number[] | string = rootsAutoMovieViewSinPolynomial(
    [0],
    0,
    Math.PI,
    1,
  );
  if (typeof endpoint === "string" || endpoint.length !== 0)
    failures.push(`endpoint sine roots became interior: ${endpoint}`);
  if (
    typeof rootsAutoMovieViewSinPolynomial(
      [Number.MAX_VALUE],
      0,
      Math.PI,
      Number.MIN_VALUE,
    ) !== "string"
  )
    failures.push("unrepresentable normalized terms were accepted");
  if (failures.length !== 0)
    throw new Error(
      `${failures.length} affine source support findings:\n${failures.join("\n")}`,
    );
}

/** A finite candidate must reach the independently known parameter; extra near-zero observations are permitted. */
function contains(
  failures: string[],
  label: string,
  candidates: number[] | string,
  expected: number,
  tolerance: number,
): void {
  if (
    typeof candidates === "string" ||
    candidates.length === 0 ||
    !candidates.every(Number.isFinite) ||
    !Number.isFinite(expected) ||
    !candidates.some(
      (candidate: number): boolean =>
        Math.abs(candidate - expected) <= tolerance,
    )
  )
    failures.push(`${label}: ${candidates}, expected ${expected}`);
}

/** Finite scalar comparison prevents a NaN maximum from satisfying an error tolerance. */
function near(
  failures: string[],
  label: string,
  actual: number,
  expected: number,
  tolerance: number,
): void {
  if (
    !Number.isFinite(actual) ||
    !Number.isFinite(expected) ||
    Math.abs(actual - expected) > tolerance
  )
    failures.push(`${label}: ${actual}, expected ${expected}`);
}
