import {
  AutoMovieHumanConicLoft,
  AutoMovieHumanConicSection,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicSection,
} from "@automovie/interface";

/**
 * The exact conversion of a bilateral section into a featured layout (`AutoMovieHumanConicSection.featured`, `convert`).
 *
 * Scenarios:
 * 1. A bilateral(1) section of unequal shoulders, converted into the trunk's lined runs (five features after the front median line, two
 *    after the back median) with both medians freed, draws the same curve: every point of the converted chain lies within 0.01 mm of the
 *    base chain and every point of the base chain within 0.01 mm of the converted one, with the converted numbers rounded as stored
 *    (millimetres to 0.01, shares and angles to 1e-4), every share inside the model's bounds and every shoulder inside (0.03, 0.85].
 * 2. The same runs with the medians kept as medians do not draw the same curve: the converted median re-resolves on its new neighbours'
 *    triangle with its tangent along their chord, so the chain leaves the base by more than 0.01 mm next to it.
 * 3. Between knots: a two-knot family whose sections differ by a few millimetres, converted at its knots, draws within 0.01 mm of the base
 *    family at the stations between them.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `featured`, `convert`, `resolve` and `AutoMovieHumanConicLoft.reader` and measures the drawn curves.
 * @evidence contracts/development/testing.md#independent-expectations The test samples the rational quadratic from its control points and computes nearest distances against the base curve. It checks both agreement within 0.01 mm and the retained median's distinct departure.
 * @evidence contracts/development/common.md#meaningful-documentation Featured conversion compares sampled curves for freed and retained medians at knots and intermediate stations. The 0.01 mm bound separates shape-preserving conversion from the visible kept-median change.
 */
export function test_human_conic_featured(): void {
  type P = [number, number];
  const failures: string[] = [];
  const S = AutoMovieHumanConicSection;
  const base: IAutoMovieHumanConicSection.ILayout = S.bilateral(1);
  const runs: IAutoMovieHumanConicSection.IFeatureRun[] = [
    {
      after: 0,
      anchors: [
        { kind: "f", feature: "inflection" },
        { kind: "f", feature: "convex" },
        { kind: "f", feature: "inflection" },
        { kind: "f", feature: "concave" },
        { kind: "f", feature: "inflection" },
      ],
    },
    {
      after: 3,
      anchors: [
        { kind: "f", feature: "convex" },
        { kind: "f", feature: "inflection" },
      ],
    },
  ];
  // The drawn chain: each arc the rational quadratic on its ends and their tangents' meeting, 200 points an arc.
  const draw = (
    values: readonly number[],
    layout: IAutoMovieHumanConicSection.ILayout,
  ): P[] => {
    const chain = S.resolve(values, layout).input;
    const n: number = chain.points.length;
    const out: P[] = [];
    for (let k: number = 0; k < n; ++k) {
      const p0 = chain.points[k] as P,
        p2 = chain.points[(k + 1) % n] as P;
      const t0 = chain.tangents[k] as P,
        t2 = chain.tangents[(k + 1) % n] as P;
      const den: number = t0[0] * t2[1] - t0[1] * t2[0];
      const a: number =
        ((p2[0] - p0[0]) * t2[1] - (p2[1] - p0[1]) * t2[0]) / den;
      const p1: P = [p0[0] + a * t0[0], p0[1] + a * t0[1]];
      const rho: number = chain.shoulders[k]!;
      const w: number = rho / (1 - rho);
      for (let i: number = 0; i < 200; ++i) {
        const t: number = i / 200;
        const b0: number = (1 - t) ** 2,
          b1: number = 2 * t * (1 - t) * w,
          b2: number = t * t;
        const d: number = b0 + b1 + b2;
        out.push([
          (b0 * p0[0] + b1 * p1[0] + b2 * p2[0]) / d,
          (b0 * p0[1] + b1 * p1[1] + b2 * p2[1]) / d,
        ]);
      }
    }
    return out;
  };
  // The farthest a point of `from` lies from the closed polyline `to`: the
  // one-sided Hausdorff distance, each point's distance being its minimum
  // over every segment of `to`. The segments are filed in a grid of square
  // cells as wide as the longest segment's larger extent, each in every cell
  // its bounding box meets. A point reads the rings of cells around its own
  // outward and stops after ring r once its nearest distance is at most r
  // cell widths: a segment filed in no cell read lies wholly outside the
  // square those rings cover, which is at least that far from the point. So
  // the minimum is the one over every segment, read in time that grows with
  // the points rather than with their product.
  const far = (from: readonly P[], to: readonly P[]): number => {
    const n: number = to.length;
    const segment = (p: P, i: number): number => {
      const a: P = to[i]!,
        b: P = to[(i + 1) % n]!;
      const dx: number = b[0] - a[0],
        dy: number = b[1] - a[1];
      const t: number = Math.max(
        0,
        Math.min(
          1,
          ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1),
        ),
      );
      return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
    };
    let width: number = 0;
    for (let i: number = 0; i < n; ++i)
      width = Math.max(
        width,
        Math.abs(to[(i + 1) % n]![0] - to[i]![0]),
        Math.abs(to[(i + 1) % n]![1] - to[i]![1]),
      );
    if (!(width > 0)) width = 1;
    const cell = (x: number): number => Math.floor(x / width);
    const cells: Map<string, number[]> = new Map();
    let low: P = [Infinity, Infinity];
    let high: P = [-Infinity, -Infinity];
    for (let i: number = 0; i < n; ++i) {
      const a: P = to[i]!,
        b: P = to[(i + 1) % n]!;
      const x0: number = cell(Math.min(a[0], b[0])),
        x1: number = cell(Math.max(a[0], b[0]));
      const y0: number = cell(Math.min(a[1], b[1])),
        y1: number = cell(Math.max(a[1], b[1]));
      low = [Math.min(low[0], x0), Math.min(low[1], y0)];
      high = [Math.max(high[0], x1), Math.max(high[1], y1)];
      for (let x: number = x0; x <= x1; ++x)
        for (let y: number = y0; y <= y1; ++y) {
          const key: string = `${x},${y}`;
          const filed: number[] | undefined = cells.get(key);
          if (filed === undefined) cells.set(key, [i]);
          else filed.push(i);
        }
    }
    let worst: number = 0;
    for (const p of from) {
      const cx: number = cell(p[0]),
        cy: number = cell(p[1]);
      let best: number = Infinity;
      for (let r: number = 0; ; ++r) {
        for (let x: number = cx - r; x <= cx + r; ++x)
          for (let y: number = cy - r; y <= cy + r; ++y) {
            if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) !== r) continue;
            for (const i of cells.get(`${x},${y}`) ?? [])
              best = Math.min(best, segment(p, i));
          }
        const covered: boolean =
          cx - r <= low[0] &&
          cy - r <= low[1] &&
          cx + r >= high[0] &&
          cy + r >= high[1];
        if (best <= r * width || covered) break;
      }
      worst = Math.max(worst, best);
    }
    return worst;
  };
  // Stored rounding: millimetres to 0.01, shares and angles to 1e-4.
  const stored = (
    values: readonly number[],
    layout: IAutoMovieHumanConicSection.ILayout,
  ): number[] =>
    values.map((x: number, i: number): number =>
      S.units(layout)[i] === "mm"
        ? Math.round(x * 100) / 100
        : Math.round(x * 1e4) / 1e4,
    );
  const section = (lift: number): number[] => [
    128 + lift,
    0.46,
    12 + lift,
    152 + lift,
    0.52,
    -112 - lift,
    0.31,
    0.62,
    0.47,
    0.71,
  ];

  // 1. Freed medians: exact up to the stored rounding.
  const freed: number[] = [1, 3];
  const lined: IAutoMovieHumanConicSection.ILayout = S.featured(
    base,
    runs,
    freed,
  );
  const converted: number[] = stored(
    S.convert(section(0), base, runs, freed),
    lined,
  );
  const b: P[] = draw(section(0), base);
  const c: P[] = draw(converted, lined);
  const there: number = Math.max(far(c, b), far(b, c));
  if (!(there <= 0.01))
    failures.push(
      `freed medians: the converted chain stands ${there.toFixed(4)} mm off the base, over 0.01`,
    );
  const units: IAutoMovieHumanConicSection.Unit[] = S.units(lined);
  const { shoulders } = S.offsets(lined);
  converted.forEach((x: number, i: number): void => {
    if (i >= shoulders) {
      if (!(x > 0.03 && x <= 0.85))
        failures.push(
          `freed medians: shoulder ${i - shoulders} at ${x} outside (0.03, 0.85]`,
        );
    } else if (units[i] === "share" && !(x > 0.03 && x < 0.97))
      failures.push(
        `freed medians: share field ${i} at ${x} outside (0.03, 0.97)`,
      );
  });

  // 2. Kept medians: the median re-resolves on its new neighbours and the chain leaves the base.
  const plain: IAutoMovieHumanConicSection.ILayout = S.featured(base, runs, []);
  const kept: P[] = draw(
    stored(S.convert(section(0), base, runs, []), plain),
    plain,
  );
  const off: number = Math.max(far(kept, b), far(b, kept));
  if (!(off > 0.01))
    failures.push(
      `kept medians: the plain conversion stands only ${off.toFixed(4)} mm off the base; it should leave it beside the medians`,
    );

  // 3. Between knots: a family converted at its knots against the base family at the stations between them.
  const family = (
    layout: IAutoMovieHumanConicSection.ILayout,
    values: number[][],
  ): IAutoMovieHumanConicLoft.IFamily => ({
    name: "probe",
    centres: [
      [0, 0, 0],
      [0, 100, 0],
    ],
    halves: [],
    up: [1, 0, 0],
    layout,
    knots: [0, 4, 8],
    values: values[0]!.map((_: number, f: number): number[] =>
      values.map((v: number[]): number => v[f]!),
    ),
  });
  const lifts: number[] = [0, 1.5, 2.5];
  const baseFamily = AutoMovieHumanConicLoft.reader(
    family(base, lifts.map(section)),
  );
  const linedFamily = AutoMovieHumanConicLoft.reader(
    family(
      lined,
      lifts.map((l: number): number[] =>
        stored(S.convert(section(l), base, runs, freed), lined),
      ),
    ),
  );
  let between: number = 0;
  for (const s of [1, 2, 3, 5, 6, 7]) {
    const drawn: P[] = draw(linedFamily(s), lined);
    const reference: P[] = draw(baseFamily(s), base);
    between = Math.max(between, far(drawn, reference), far(reference, drawn));
  }
  if (!(between <= 0.01))
    failures.push(
      `between knots: the converted family stands ${between.toFixed(4)} mm off the base, over 0.01`,
    );

  if (failures.length > 0)
    throw new Error("test_human_conic_featured:\n" + failures.join("\n"));
}
