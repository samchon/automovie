import {
  type AutoMovieLoftContract,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import { PriorityQueue } from "tstl";

type Quarters = IAutoMovieViewPart.IQuarters<number>;

/**
 * The view section's girth rises monotonically with its shoulder inside the
 * box's reach, one girth solves back to its one shoulder, and a girth the box
 * cannot reach, or a box with no valid section, gives the end shape or none
 * with exactly one diagnostic.
 *
 * Scenarios:
 * 1. Reach: for a 60 by 40 box, a 120 by 40 box and two asymmetric boxes, the valid shoulder range holds the ellipse's shoulder and its girths lie inside the taut-tape bounds `2 sqrt(W^2 + D^2)` (the rhombus) and `2 (W + D)` (the rectangle).
 * 2. Monotone: 64 shoulders across each range give strictly rising girths; a made sequence with one fall must fail the same reader.
 * 3. Round trip: at five shoulders across each range, and with four sourced departures on one box, the girth of the section solves back to its shoulder within the solve's 1e-6 mm girth tolerance over the girth's slope, with no diagnostic; a made shoulder 0.01 off must fail the same reader.
 * 4. Out of reach: a girth 1 mm under the reach gives the least shoulder's section and one `girth in reach` diagnostic, 1 mm over it the greatest shoulder's and one diagnostic; the reach's own ends give none.
 * 5. No valid section: a departure that pushes one quarter's shoulder past 1 gives no section and one `view section` diagnostic.
 * 6. Concentrated native clock: the four unchanged upper endpoints from36619 and their inward1e-6/2e-6 neighbors have finite lengths. On the two symmetric boxes, independent positive rational-quadratic control-polygon bounds also enclose the full perimeter.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieViewSection.range`, `.of` and `.solve` and reads their sections' `girth` and `shoulders` and their diagnostics. It catches a girth that does not rise with the shoulder (two shoulders for one girth), a reach outside the taut-tape bounds, a solve that lands on the wrong shoulder or misses its girth, a girth outside the reach clamped to the wrong end or reported more or less than once, and a broken box returning a section; any operator that solves one girth to its one shoulder and reports what it cannot reach passes.
 * @evidence contracts/development/testing.md#independent-expectations Convex geometry bounds the tape between the rhombus and box perimeters (#3045, #3046). Positive homogeneous quadratic subdivision additionally bounds raw symmetric-quarter length by chords and control polygons, independently of production native-speed/Gauss quadrature; floating arithmetic is not an interval certificate. The shoulder limit remains the published1e-6 mm girth tolerance divided by a second-order central or inward one-sided girth slope, doubled for difference error. Contract names remain `girth in reach` and `view section`. Monotonicity is read at64 shoulders, so a fold between them can pass.
 * @evidence contracts/development/testing.md#distinguishing-cases Positive: in-reach girths across each range, at both ends and with departures. Negative: girths 1 mm outside on each side, a box with no valid section, and made falling and off-shoulder readings. Boundary: the reach's end girths, which must solve with no diagnostic. The section's shape and its guides belong to `test_construction_operator_view_section`; the chain to `test_construction_operator_view_section_chain`.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_lofting_view_section_girth`; it builds made boxes in process, generates no person and starts no host, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Reach: for a 60 by 40 box, a 120 by 40 box and two asymmetric boxes, the valid shoulder range holds the ellipse's shoulder and its girths...).
 */
export function test_construction_operator_view_section_girth(): void {
  const failures: string[] = [];
  const boxes: Quarters[] = [
    [30, 20, 30, 20],
    [60, 20, 60, 20],
    [30, 12, 18, 25],
    [12, 40, 20, 8],
  ];
  for (const extents of boxes) {
    const label: string = `box [${extents.join(", ")}]`;
    const box: AutoMovieViewSection.IBox = { extents };
    const W: number = extents[0] + extents[2];
    const D: number = extents[1] + extents[3];
    const range: AutoMovieViewSection.IRange | null =
      AutoMovieViewSection.range(box);
    if (range === null) {
      failures.push(`${label}: no valid range`);
      continue;
    }

    // 1. Reach inside the taut-tape bounds, holding the ellipse.
    const [lo, hi]: [number, number] = range.girth;
    if (
      !(
        range.shoulder[0] < AutoMovieViewSection.ELLIPSE &&
        AutoMovieViewSection.ELLIPSE < range.shoulder[1]
      )
    )
      failures.push(
        `${label}: shoulder range [${range.shoulder.join(", ")}] does not hold the ellipse's`,
      );
    if (
      !(
        2 * Math.hypot(W, D) <= lo * (1 + 1e-12) &&
        lo < hi &&
        hi <= 2 * (W + D) * (1 + 1e-12)
      )
    )
      failures.push(
        `${label}: reach ${lo} to ${hi} mm outside the rhombus ${2 * Math.hypot(W, D)} and rectangle ${2 * (W + D)} mm`,
      );

    // 2. Monotone girth over the range.
    const girth: (r: number) => number = (r: number): number =>
      AutoMovieViewSection.of(box, [r, r, r, r]).girth;
    const sequence: number[] = Array.from(
      { length: 64 },
      (_: unknown, i: number): number =>
        girth(
          range.shoulder[0] +
            ((range.shoulder[1] - range.shoulder[0]) * i) / 63,
        ),
    );
    const fall: string | null = falls(sequence);
    if (fall !== null) failures.push(`${label}: ${fall}`);

    // 3. Round trip at five shoulders.
    for (const share of [0, 0.3, 0.5, 0.7, 1]) {
      const r: number =
        range.shoulder[0] + share * (range.shoulder[1] - range.shoulder[0]);
      failures.push(
        ...roundTrip(
          `${label} at shoulder ${r}`,
          box,
          [0, 0, 0, 0],
          r,
          AutoMovieViewSection.solve("made", box, girth(r)),
          range.shoulder,
        ),
      );
    }

    // 4. Girths 1 mm outside the reach each way.
    const under: AutoMovieViewSection.ISolved = AutoMovieViewSection.solve(
      "made",
      box,
      lo - 1,
    );
    const over: AutoMovieViewSection.ISolved = AutoMovieViewSection.solve(
      "made",
      box,
      hi + 1,
    );
    for (const [name, solved, end] of [
      ["under", under, range.shoulder[0]],
      ["over", over, range.shoulder[1]],
    ] as [string, AutoMovieViewSection.ISolved, number][]) {
      if (
        solved.section === null ||
        solved.section.shoulders.some((s: number): boolean => s !== end)
      )
        failures.push(
          `${label} ${name} the reach: section at shoulders [${solved.section?.shoulders.join(", ")}], expected ${end}`,
        );
      if (
        !(
          solved.diagnostics.length === 1 &&
          solved.diagnostics[0]!.contract === "girth in reach"
        )
      )
        failures.push(
          `${label} ${name} the reach: diagnostics [${solved.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => d.contract).join(", ")}], expected one girth in reach`,
        );
    }
  }

  // 3b. Round trip with sourced departures per quarter.
  const box: AutoMovieViewSection.IBox = { extents: [30, 12, 18, 25] };
  const departures: Quarters = [0.05, -0.05, 0.03, -0.03];
  const range: AutoMovieViewSection.IRange | null = AutoMovieViewSection.range(
    box,
    departures,
  );
  if (range === null) failures.push("departures: no valid range");
  else {
    const r: number = (range.shoulder[0] + range.shoulder[1]) / 2;
    const g: number = AutoMovieViewSection.of(
      box,
      departures.map((d: number): number => r + d) as Quarters,
    ).girth;
    failures.push(
      ...roundTrip(
        "departures",
        box,
        departures,
        r,
        AutoMovieViewSection.solve("made", box, g, departures),
        range.shoulder,
      ),
    );
  }

  // 5. A box with no valid section.
  const none: AutoMovieViewSection.ISolved = AutoMovieViewSection.solve(
    "made",
    { extents: [30, 20, 30, 20] },
    150,
    [0.7, 0, 0, 0],
  );
  if (none.section !== null)
    failures.push("no valid section: a section is returned");
  if (
    !(
      none.diagnostics.length === 1 &&
      none.diagnostics[0]!.contract === "view section"
    )
  )
    failures.push(
      `no valid section: diagnostics [${none.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => d.contract).join(", ")}], expected one view section`,
    );

  // Red proofs of the readers.
  if (falls([1, 2, 3, 2.5, 4]) === null)
    failures.push("proof: a falling girth sequence passes the monotone reader");
  const made: AutoMovieViewSection.ISolved = {
    section: AutoMovieViewSection.of(box, [0.42, 0.42, 0.42, 0.42]),
    diagnostics: [],
  };
  if (roundTrip("proof", box, [0, 0, 0, 0], 0.41, made).length === 0)
    failures.push(
      "proof: a section 0.01 off its shoulder passes the round-trip reader",
    );

  // Actual earlier upper endpoints and their inward observer nodes must all
  // have finite measurements. For the symmetric boxes the four raw conics
  // also have independent positive-control-polygon perimeter enclosures.
  for (const [extents, shoulder] of [
    [[30, 20, 30, 20], 0.9999459332049687],
    [[60, 20, 60, 20], 0.9999028648215844],
    [[30, 12, 18, 25], 0.9999646654203607],
    [[12, 40, 20, 8], 0.9999307274644225],
  ] as [Quarters, number][]) {
    for (const offset of [0, -1e-6, -2e-6]) {
      const r: number = shoulder + offset;
      const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of(
        { extents },
        [r, r, r, r],
      );
      if (!Number.isFinite(section.girth))
        failures.push(
          `upper inward length ${extents}/${r}: ${AutoMovieViewSection.fault(section)}`,
        );
      if (extents[0] !== extents[2] || extents[1] !== extents[3]) continue;
      const bounds: [number, number] | null = quadraticBounds(
        extents[0],
        extents[1],
        r,
      );
      if (
        bounds === null ||
        !(
          section.girth >= 4 * bounds[0] - 1e-7 &&
          section.girth <= 4 * bounds[1] + 1e-7
        )
      )
        failures.push(
          `upper independent perimeter ${extents}/${r}: ${section.girth}, quarter bounds ${bounds}`,
        );
    }
  }

  if (failures.length !== 0)
    throw new Error(
      `${failures.length} view section girth failures:\n${failures.join("\n")}`,
    );
}

/** The first place a sequence fails to rise strictly, or null. */
function falls(sequence: readonly number[]): string | null {
  for (let i: number = 1; i < sequence.length; i++)
    if (!(sequence[i]! > sequence[i - 1]!))
      return `girth ${sequence[i]} after ${sequence[i - 1]} at step ${i}: not rising`;
  return null;
}

/**
 * Every round-trip failure of a solve aimed at shoulder `r`: a diagnostic, a
 * missing section, a girth off its target by more than the solve's tolerance,
 * or a shoulder off `r` by more than that tolerance over the girth's slope.
 */
function roundTrip(
  label: string,
  box: AutoMovieViewSection.IBox,
  departures: Quarters,
  r: number,
  solved: AutoMovieViewSection.ISolved,
  reach?: readonly [number, number],
): string[] {
  const at: (x: number) => number = (x: number): number =>
    AutoMovieViewSection.of(
      box,
      departures.map((d: number): number => x + d) as Quarters,
    ).girth;
  const target: number = at(r);
  if (solved.diagnostics.length !== 0)
    return [
      `${label}: diagnostics ${solved.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => d.detail).join("; ")}`,
    ];
  if (solved.section === null) return [`${label}: no section`];
  const out: string[] = [];
  if (!(Math.abs(solved.section.girth - target) <= 1e-6))
    out.push(`${label}: girth ${solved.section.girth} against ${target} mm`);
  const h: number = 1e-6;

  // Endpoints are part of the test. The three-point one-sided derivative has
  // the same second-order truncation order as the central difference and
  // stays inside the actual admitted reach; the 2x allowance remains.
  const lower: number = reach?.[0] ?? -Math.min(...departures);
  const upper: number = reach?.[1] ?? 1 - Math.max(...departures);
  const slope: number =
    r - h > lower && r + h < upper
      ? Math.abs(at(r + h) - at(r - h)) / (2 * h)
      : r - h <= lower
        ? Math.abs(-3 * target + 4 * at(r + h) - at(r + 2 * h)) / (2 * h)
        : Math.abs(3 * target - 4 * at(r - h) + at(r - 2 * h)) / (2 * h);
  const limit: number = (2 * 1e-6) / slope + 1e-12;
  const got: number = solved.section.shoulders[0]! - departures[0]!;
  if (!(Math.abs(got - r) <= limit)) {
    const neighbors: {
      shoulder: number;
      girth: number;
      fault: string | null;
    }[] = [-2, -1, 0, 1, 2].map(
      (
        i: number,
      ): { shoulder: number; girth: number; fault: string | null } => {
        const x: number = r + i * h;
        const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of(
          box,
          departures.map((d: number): number => x + d) as Quarters,
        );
        return {
          shoulder: x,
          girth: section.girth,
          fault: AutoMovieViewSection.fault(section),
        };
      },
    );
    out.push(
      `${label}: shoulder ${got} against ${r}, limit ${limit}; neighboring measurements ${JSON.stringify(neighbors)}`,
    );
  }
  return out;
}

/**
 * Independent raw-quadratic length bounds from positive homogeneous controls.
 * The convex arc's chord is a lower bound; its control polygon is an upper
 * bound. Dyadic subdivision tightens both geometrically, without native speed
 * or Gaussian nodes. Refine the largest global gap until the sum's unchanged
 * 2.5e-9 target is met, rather than assigning a tiny local budget below the
 * projection's coordinate-rounding scale. The65536-node limit remains.
 * Ordinary binary64 bounds are not outward-rounded interval certificates.
 */
function quadraticBounds(
  a: number,
  b: number,
  r: number,
): [number, number] | null {
  const w: number = r / (1 - r);
  const scale: number = Math.max(1, w);
  const initial: [number, number, number][] = [
    [a / scale, 0, 1 / scale],
    [a * (w / scale), b * (w / scale), w / scale],
    [0, b / scale, 1 / scale],
  ];
  const firstPanel: IQuadraticPanel | null = quadraticPanel(initial);
  if (firstPanel === null) return null;
  const pending: PriorityQueue<IQuadraticPanel> =
    new PriorityQueue<IQuadraticPanel>(
      (x: IQuadraticPanel, y: IQuadraticPanel): boolean =>
        x.upper - x.lower < y.upper - y.lower,
    );
  pending.push(firstPanel);
  let lower: number = firstPanel.lower;
  let upper: number = firstPanel.upper;
  let visits: number = 1;
  while (upper - lower > 2.5e-9) {
    if (visits + 2 > 65536) return null;
    const current: IQuadraticPanel = pending.top();
    pending.pop();
    const controls: [number, number, number][] = current.controls;
    const first: [number, number, number] = controls[0]!.map(
      (v: number, i: number): number => (v + controls[1]![i]!) / 2,
    ) as [number, number, number];
    const last: [number, number, number] = controls[1]!.map(
      (v: number, i: number): number => (v + controls[2]![i]!) / 2,
    ) as [number, number, number];
    const middle: [number, number, number] = first.map(
      (v: number, i: number): number => (v + last[i]!) / 2,
    ) as [number, number, number];
    const left: IQuadraticPanel | null = quadraticPanel([
      controls[0]!,
      first,
      middle,
    ]);
    const right: IQuadraticPanel | null = quadraticPanel([
      middle,
      last,
      controls[2]!,
    ]);
    if (left === null || right === null) return null;
    lower += left.lower + right.lower - current.lower;
    upper += left.upper + right.upper - current.upper;
    pending.push(left, right);
    visits += 2;
  }
  console.log("independent conic perimeter enclosure:", {
    a,
    b,
    r,
    lower,
    upper,
    gap: upper - lower,
    visits,
  });
  return [lower, upper];
}

/** One raw rational quadratic subarc and its geometric length bounds. */
interface IQuadraticPanel {
  /** Three positive homogeneous [weighted x,weighted y,weight] controls. */
  controls: [number, number, number][];

  /** Chord length, millimetres. */
  lower: number;

  /** Control polygon length, millimetres. */
  upper: number;
}

/** Read convex geometric bounds without any production speed or native quadrature. */
function quadraticPanel(
  controls: [number, number, number][],
): IQuadraticPanel | null {
  const points: [number, number][] = controls.map(
    (p: [number, number, number]): [number, number] => [
      p[0] / p[2],
      p[1] / p[2],
    ],
  );
  const lower: number = Math.hypot(
    points[2]![0] - points[0]![0],
    points[2]![1] - points[0]![1],
  );
  const upper: number =
    Math.hypot(points[1]![0] - points[0]![0], points[1]![1] - points[0]![1]) +
    Math.hypot(points[2]![0] - points[1]![0], points[2]![1] - points[1]![1]);
  return [lower, upper].every(Number.isFinite)
    ? { controls, lower, upper }
    : null;
}
