import {
  type AutoMoviePolarSector,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { ConstructionConicOracle } from "../../../internal/construction/ConstructionConicOracle";
import { ConstructionViewOracle } from "../../../internal/construction/ConstructionViewOracle";

type Quarters = IAutoMovieViewPart.IQuarters<number>;
type Jet = AutoMoviePolarSector.Jet;

/**
 * Four reference spans retain the ellipse oracle's existing Hermite error
 * ceiling. The current source is read directly from its rational pieces;
 * this reference ceiling does not describe its implementation.
 */
const SPANS: number = 4;

/**
 * The view section reproduces the centred ellipse at the ellipse's shoulder,
 * touches its box at the four guides with zero angular slope and its declared
 * curvature, and is C2 across every guide whatever its quarters' fullness.
 *
 * Scenarios:
 * 1. Ellipse: boxes of half axes 30 by 20, 20 by 30, 60 by 20, 20 by 60 and 25 by 25 mm at the shoulder `sqrt(2) - 1` in every quarter: the radius within the knot spans' Hermite bound of the closed-form ellipse at 4096 angles, the girth within the bound's first-order effect of the ellipse's AGM perimeter, each guide's curvature the ellipse's `a / b^2`; on every box a section with every shoulder 0.02 fuller must exceed the bound.
 * 2. Touch: boxes of aspect 1:3 to 3:1 and two asymmetric boxes, at three shoulders across each box's valid range: at every guide the radius is the half extent, the angular slope zero, the curvature the declared smaller of the two quarters' conic curvatures (read from the jet and, independently, from the section's points on each side of the guide, extrapolated to zero step), and the section never passes the side it touches; a made jet with a slope of 0.01 at a guide, and the ellipse turned 20 degrees, must fail.
 * 3. Continuity: sections with different shoulders on a square and a 30 by 20 mm box have matching analytic one-sided limits at each guide. The control-polygon limits independently agree with the original min-quarter curvature law and actual guide jet. Generic closed-form/red functions retain their extrapolation reader, including the curvature step between two different ellipses.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds sections with `AutoMovieViewSection.of` and `.range` and reads them through `.radius`, `.curvatures` and `ISection.girth`. It catches a section that departs from the ellipse at the ellipse's shoulder, a guide whose radius, slope or curvature is not the box's and the declared law's, a section that crosses the box side it should touch, and a curvature jump at a guide between two quarters; any construction that touches the box at its guides with the declared curvature and is C2 there passes.
 * @evidence contracts/testing.md#independent-expectations Expectations are closed forms independent of the operator: the ellipse's polar radius and exact derivatives by Taylor arithmetic and its perimeter by the AGM (`ConstructionViewOracle`); the quintic Hermite remainder of each knot span (`max|rho^(6)| h^6 / (720 * 64)`), the knots at the guides and at the conic's points of parameter 1/4, 2/4 and 3/4, whose exact jets the ellipse at its shoulder has (that conic is the ellipse); the girth bound `2 pi max|w| E` from the length's first variation, taken one and a half times for its second-order terms; the guide curvature law the operator publishes (#3046: each guide the smaller of its quarters' conic end curvatures `a / (2 w^2 b^2)`, `w = r / (1 - r)`, so no quarter must straighten back out); a polar curve's curvature `(rho^2 + 2 rho'^2 - rho rho'') / (rho^2 + rho'^2)^(3/2)`, read here from the circles through the guide's point and points 1e-3, 2e-3 and 4e-3 rad into each sector (inside its first conic span), extrapolated twice to zero step so a jump of the third derivative at a guide does not enter and the circle fit's rounding, of order `eps rho / h^2`, stays near 1e-9 of the curvature. Rounding limits are 1e-12 of the extent on values and 1e-9 on the second derivative. Oracle limits: the shoulder's own share of the girth is the round-trip test's.
 * @evidence contracts/testing.md#distinguishing-cases Square, long and tall boxes, asymmetric boxes, shoulders near both ends of each box's range and at its middle, one shoulder per quarter; red on the fuller ellipses, a sloped guide, a turned ellipse and a curvature step. The girth solve, monotonicity, reach and diagnostics belong to `test_construction_operator_view_section_girth`; the chain, its knots and its station continuity to `test_construction_operator_view_section_chain`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_lofting_view_section`; it builds closed-form boxes in process, generates no person and starts no host, browser or GPU.
 */
export function test_construction_operator_view_section(): void {
  const failures: string[] = [];
  const E: number = AutoMovieViewSection.ELLIPSE;

  // 1. Ellipse.
  for (const [a, b] of [
    [30, 20],
    [20, 30],
    [60, 20],
    [20, 60],
    [25, 25],
  ] as [number, number][]) {
    const box: AutoMovieViewSection.IBox = { extents: [a, b, a, b] };
    const bound: number = ConstructionViewOracle.bound(a, b, SPANS);
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of(
      box,
      [E, E, E, E],
    );
    const error: number = radiusError(section, a, b);
    if (!(error <= bound))
      failures.push(
        `ellipse ${a} by ${b}: radius error ${error} mm over the interpolation bound ${bound} mm`,
      );
    const girth: number =
      1.5 * 2 * Math.PI * ConstructionViewOracle.weight(a, b, 512) * bound +
      1e-9;
    const perimeter: number = ConstructionViewOracle.perimeter(a, b);
    if (!(Math.abs(section.girth - perimeter) <= girth))
      failures.push(
        `ellipse ${a} by ${b}: girth ${section.girth} against the perimeter ${perimeter} mm, limit ${girth} mm`,
      );
    const kappa: Quarters = AutoMovieViewSection.curvatures(box, [E, E, E, E]);
    [a / (b * b), b / (a * a), a / (b * b), b / (a * a)].forEach(
      (want: number, g: number): void => {
        if (!(Math.abs(kappa[g]! - want) <= 1e-12 * want))
          failures.push(
            `ellipse ${a} by ${b}: guide ${g} curvature ${kappa[g]} against a / b^2 ${want}`,
          );
      },
    );

    // Red: a section 0.02 fuller than the ellipse's shoulder stands out of the bound.
    const fuller: number = radiusError(
      AutoMovieViewSection.of(box, [E + 0.02, E + 0.02, E + 0.02, E + 0.02]),
      a,
      b,
    );
    if (!(fuller > bound))
      failures.push(
        `ellipse ${a} by ${b}: the 0.02 fuller section reads ${fuller} mm, inside the bound ${bound} mm`,
      );
  }

  // 2. Touch, on boxes of every aspect and two asymmetric ones.
  const boxes: Quarters[] = [
    [20 / 3, 20, 20 / 3, 20],
    [10, 20, 10, 20],
    [20, 20, 20, 20],
    [40, 20, 40, 20],
    [60, 20, 60, 20],
    [30, 12, 18, 25],
    [12, 40, 20, 8],
  ];
  for (const extents of boxes) {
    const box: AutoMovieViewSection.IBox = { extents };
    const range: AutoMovieViewSection.IRange | null =
      AutoMovieViewSection.range(box);
    if (range === null) {
      failures.push(
        `box [${extents.join(", ")}]: no valid range at the ellipse's shoulder`,
      );
      continue;
    }
    for (const share of [0.1, 0.5, 0.9]) {
      const r: number =
        range.shoulder[0] + share * (range.shoulder[1] - range.shoulder[0]);
      const shoulders: Quarters = [r, r, r, r];
      const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of(
        box,
        shoulders,
      );
      const label: string = `box [${extents.map((e: number): string => e.toFixed(2)).join(", ")}] at shoulder ${r.toFixed(4)}`;
      failures.push(
        ...touch(
          label,
          (phi: number): Jet => AutoMovieViewSection.radius(section, phi),
          extents,
          law(extents, shoulders),
          section.knots.map(
            (k: AutoMoviePolarSector.IGuide): number => k.angle,
          ),
        ),
      );
    }
  }

  // Touch, red: a guide with a slope, and the ellipse turned 20 degrees.
  const ellipse: Quarters = [30, 20, 30, 20];
  const sloped: (phi: number) => Jet = (phi: number): Jet => {
    const d: number[] = ConstructionViewOracle.derivatives(30, 20, phi);
    return [
      d[0]! + 0.01 * 30 * Math.sin(phi),
      d[1]! + 0.01 * 30 * Math.cos(phi),
      d[2]! - 0.01 * 30 * Math.sin(phi),
    ];
  };
  const kappa: Quarters = [30 / 400, 20 / 900, 30 / 400, 20 / 900];
  if (
    touch(
      "made",
      (phi: number): Jet =>
        ConstructionViewOracle.derivatives(30, 20, phi) as Jet,
      ellipse,
      kappa,
    ).length !== 0
  )
    failures.push("touch: the closed-form ellipse fails the touch reader");
  if (touch("made", sloped, ellipse, kappa).length === 0)
    failures.push("touch: a guide sloped 0.01 passes the touch reader");
  const turn: number = (20 * Math.PI) / 180;
  if (
    touch(
      "made",
      (phi: number): Jet =>
        ConstructionViewOracle.derivatives(30, 20, phi - turn) as Jet,
      ellipse,
      kappa,
    ).length === 0
  )
    failures.push(
      "touch: the ellipse turned 20 degrees passes the touch reader",
    );

  // 3. Continuity across every guide with a different shoulder in each
  // quarter: sourced departures of 0.01 and 0.02 about the middle of the
  // range those departures leave (`range` with departures), so the section is
  // valid by the operator's own reach.
  for (const [extents, departures] of [
    [
      [20, 20, 20, 20],
      [0.02, -0.02, 0.01, -0.01],
    ],
    [
      [30, 20, 30, 20],
      [-0.01, 0.02, -0.02, 0.01],
    ],
  ] as [Quarters, Quarters][]) {
    const reach: AutoMovieViewSection.IRange | null =
      AutoMovieViewSection.range({ extents }, departures);
    if (reach === null) {
      failures.push(
        `continuity: departures [${departures.join(", ")}] on [${extents.join(", ")}] leave no valid range`,
      );
      continue;
    }
    const r: number = (reach.shoulder[0] + reach.shoulder[1]) / 2;
    const shoulders: Quarters = departures.map(
      (d: number): number => r + d,
    ) as Quarters;
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of(
      { extents },
      shoulders,
    );
    const fault: string | null = AutoMovieViewSection.fault(section);
    if (fault !== null) {
      failures.push(
        `continuity: shoulders [${shoulders.join(", ")}] on [${extents.join(", ")}] are not a valid section: ${fault}`,
      );
      continue;
    }
    const expected: Jet[] = law(extents, shoulders).map(
      (kappa: number, g: number): Jet => [
        extents[g]!,
        0,
        extents[g]! - kappa * extents[g]! ** 2,
      ],
    );
    failures.push(
      ...continuity(
        `shoulders [${shoulders.join(", ")}] on [${extents.join(", ")}]`,
        (phi: number): Jet => AutoMovieViewSection.radius(section, phi),
        extents,
        ConstructionConicOracle.limits(section),
        expected,
      ),
    );
  }

  // Continuity, red: two ellipses of depth 20 and 24 mm meeting at guide 0.
  const joined: (phi: number) => Jet = (phi: number): Jet => {
    const wrapped: number =
      ((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return ConstructionViewOracle.derivatives(
      30,
      wrapped < Math.PI ? 20 : 24,
      phi,
    ).slice(0, 3) as Jet;
  };
  if (continuity("made", joined, [30, 20, 30, 24]).length === 0)
    failures.push(
      "continuity: a curvature step at guide 0 passes the continuity reader",
    );
  if (
    continuity(
      "made",
      (phi: number): Jet =>
        ConstructionViewOracle.derivatives(30, 20, phi).slice(0, 3) as Jet,
      ellipse,
    ).length !== 0
  )
    failures.push(
      "continuity: the closed-form ellipse fails the continuity reader",
    );

  if (failures.length !== 0)
    throw new Error(
      `${failures.length} view section failures:\n${failures.join("\n")}`,
    );
}

/** The largest radius difference from the closed-form ellipse over 4096 angles, mm. */
function radiusError(
  section: AutoMovieViewSection.ISection,
  a: number,
  b: number,
): number {
  let worst: number = 0;
  for (let i: number = 0; i < 4096; i++) {
    const phi: number = (2 * Math.PI * i) / 4096;
    worst = Math.max(
      worst,
      Math.abs(
        AutoMovieViewSection.radius(section, phi)[0] -
          ConstructionViewOracle.radius(a, b, phi),
      ),
    );
  }
  return worst;
}

/**
 * The declared guide curvature law (#3046): guide `g`'s curvature is the
 * smaller of its two quarters' conic end curvatures (the flatter quarter's), each `along / (2 w^2 across^2)`
 * with `w = r / (1 - r)`.
 */
function law(e: Quarters, r: Quarters): Quarters {
  const conic: (q: number, along: number, across: number) => number = (
    q: number,
    along: number,
    across: number,
  ): number => {
    const w: number = r[q]! / (1 - r[q]!);
    return along / (2 * w * w * across * across);
  };
  return [0, 1, 2, 3].map((g: number): number =>
    Math.min(
      conic((g + 3) % 4, e[g]!, e[(g + 3) % 4]!),
      conic(g, e[g]!, e[(g + 1) % 4]!),
    ),
  ) as Quarters;
}

/**
 * Every touch failure of a radius jet at the four guides: the radius is the
 * half extent, the slope zero, the jet's curvature and the curvature of the
 * circles through the section's points on each side, extrapolated to zero step, are the declared one, and no
 * point of the section passes the side its guide touches.
 */
function touch(
  label: string,
  jet: (phi: number) => Jet,
  extents: Quarters,
  kappa: Quarters,
  knots: readonly number[] = [],
): string[] {
  const out: string[] = [];
  for (let g: number = 0; g < 4; g++) {
    const at: number = (g * Math.PI) / 2;
    const e: number = extents[g]!;
    const [r, r1, r2]: Jet = jet(at);
    if (!(Math.abs(r - e) <= 1e-12 * e * 10))
      out.push(`${label} guide ${g}: radius ${r} against the half extent ${e}`);
    if (!(Math.abs(r1) <= 1e-12 * e * 10))
      out.push(`${label} guide ${g}: angular slope ${r1}`);
    const curvature: number =
      (r * r + 2 * r1 * r1 - r * r2) / (r * r + r1 * r1) ** 1.5;
    if (!(Math.abs(curvature - kappa[g]!) <= 1e-9 * kappa[g]!))
      out.push(
        `${label} guide ${g}: jet curvature ${curvature} against the declared ${kappa[g]}`,
      );

    // The curvature from the section's points alone, one side at a time: the
    // circle through the guide's point and the points h and 2h into one
    // sector errs by terms in h and h^2 (the sector's third derivative may
    // jump at a guide), so the circles of h, 2h and 4h are extrapolated twice
    // to zero step (Richardson), leaving a term in h^3. The step is a
    // sixteenth of the knot span beside the guide (or 1e-3 rad on a closed
    // form), so the farthest point, 8h, stays inside that span where the
    // section is one analytic piece; a step of 1e-3 rad
    // keeps the circle fit's rounding, of order 1e-16 rho / h^2, near 1e-9 of
    // the curvature, where the earlier 2e-5 rad step left it near 1e-5.
    const p: (phi: number) => [number, number] = (
      phi: number,
    ): [number, number] => {
      const rho: number = jet(phi)[0];
      return [rho * Math.cos(phi), rho * Math.sin(phi)];
    };
    for (const side of [-1, 1]) {
      const d: number = side * step(at, side, knots);
      const c1: number = circle(p(at), p(at + d), p(at + 2 * d));
      const c2: number = circle(p(at), p(at + 2 * d), p(at + 4 * d));
      const c4: number = circle(p(at), p(at + 4 * d), p(at + 8 * d));
      const r1: number = 2 * c1 - c2;
      const r2: number = 2 * c2 - c4;
      const read: number = Math.abs((4 * r1 - r2) / 3);

      // The fit's rounding, of order `eps rho / h^2` in curvature, amplified by the extrapolation, and the
      // extrapolation's own remainder, read a posteriori from its two first-stage values: near a guide whose
      // two quarters' curvatures differ tenfold the span's curvature turns fast and that remainder dominates.
      if (
        !(
          Math.abs(read - kappa[g]!) <=
          1e-6 * kappa[g]! +
            (1e3 * Number.EPSILON * e) / (d * d) +
            Math.abs(r1 - r2)
        )
      )
        out.push(
          `${label} guide ${g}: point curvature ${read} on its ${side < 0 ? "lower" : "upper"} side against the declared ${kappa[g]}`,
        );
    }

    // No point past the side the guide touches.
    let reach: number = -Infinity;
    for (let i: number = 0; i < 4096; i++) {
      const phi: number = (2 * Math.PI * i) / 4096;
      reach = Math.max(reach, jet(phi)[0] * Math.cos(phi - at));
    }
    if (!(reach <= e * (1 + 1e-12)))
      out.push(
        `${label} guide ${g}: the section reaches ${reach} past its side at ${e}`,
      );
  }
  return out;
}

/**
 * Compare true endpoint limits of analytic pieces with each other, the
 * original input curvature law and the actual guide jet. The independent
 * control-polygon oracle supplies those limits for production sections.
 * Closed-form/red functions retain their generic fixed-h observation.
 * Linear extrapolation at h and 2h has error -h^2*f''(xi); for rho'' this
 * depends on rho'''' and is not bounded uniformly across short G2 supports.
 */
function continuity(
  label: string,
  jet: (phi: number) => Jet,
  extents: Quarters,
  limits?: readonly [Jet, Jet][],
  expected?: readonly Jet[],
): string[] {
  const out: string[] = [];
  const h: number = 1e-5;
  for (let g: number = 0; g < 4; g++) {
    const at: number = (g * Math.PI) / 2;
    const left: Jet =
      limits?.[g]?.[0] ??
      (jet(at - h).map(
        (v: number, k: number): number => 2 * v - jet(at - 2 * h)[k]!,
      ) as Jet);
    const right: Jet =
      limits?.[g]?.[1] ??
      (jet(at + h).map(
        (v: number, k: number): number => 2 * v - jet(at + 2 * h)[k]!,
      ) as Jet);
    ["radius", "slope", "second derivative"].forEach(
      (name: string, k: number): void => {
        const step: number = Math.abs(left[k]! - right[k]!);
        if (!(step <= 1e-6 * extents[g]!))
          out.push(`${label} guide ${g}: ${name} steps by ${step}`);
        if (expected !== undefined)
          for (const [source, value] of [
            ["left", left[k]],
            ["right", right[k]],
            ["guide", jet(at)[k]],
          ] as [string, number][]) {
            if (!(Math.abs(value - expected[g]![k]!) <= 1e-6 * extents[g]!))
              out.push(
                `${label} guide ${g}: ${source} ${name} ${value} against original law ${expected[g]![k]}`,
              );
          }
      },
    );
  }
  return out;
}

/** Signed curvature of the circle through three points, 1/mm. */
function circle(
  a: [number, number],
  b: [number, number],
  c: [number, number],
): number {
  const cross: number =
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  return (
    (2 * cross) /
    (Math.hypot(b[0] - a[0], b[1] - a[1]) *
      Math.hypot(c[0] - b[0], c[1] - b[1]) *
      Math.hypot(a[0] - c[0], a[1] - c[1]))
  );
}

/**
 * The reading step beside a guide is a sixteenth of the nearest observation gap, keeping eight steps inside one ordinary source piece; at most2.5e-4 rad, or1e-3 rad for a closed form without observations. The circle reader retains its explicit rounding and a posteriori remainder allowances.
 *
 * @param at The guide's angle.
 * @param side -1 for the lower side, 1 for the upper.
 * @param knots The section's knot angles, increasing from the first guide over one turn.
 * @returns The step, radians, positive.
 */
function step(at: number, side: number, knots: readonly number[]): number {
  if (knots.length === 0) return 1e-3;

  // Richardson leaves an h^3 remainder on an analytic piece. The retained
  // step and explicit rounding/remainder allowance belong to the point-fit
  // observer; the independent analytic limits own the C2 assertion.
  const turn: number = 2 * Math.PI;
  const wrap: (a: number) => number = (a: number): number =>
    ((a % turn) + turn) % turn;
  let span: number = Infinity;
  for (const k of knots) {
    const d: number = side > 0 ? wrap(k - at) : wrap(at - k);
    if (d > 1e-12 && d < span) span = d;
  }
  return Math.min(2.5e-4, span / 16);
}
