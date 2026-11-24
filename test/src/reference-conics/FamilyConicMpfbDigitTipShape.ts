import {
  AutoMovieViewOutline as Outline,
  reduceAutoMovieQrDesign,
} from "@automovie/engine";
import type { IAutoMovieViewPart } from "@automovie/interface";

import type { FamilyConicMpfbDigitTips as Tips } from "./FamilyConicMpfbDigitTips";

/** Independently measured transverse extents of a distal conic section. */
export namespace FamilyConicMpfbDigitTipShape {
  type Jet = [value: number, first: number, second: number];
  type Law = (root: number) => Jet;
  type Guide = IAutoMovieViewPart.IOutline;

  /** Keep the ordinary section family and fit only its distal outline sources. */
  export function fit(
    original: IAutoMovieViewPart,
    extents: NonNullable<Tips.ICap["extents"]>,
    tip: number,
  ): IAutoMovieViewPart {
    const { fullness } = original;
    if (
      fullness.kind !== "top" ||
      fullness.touch === undefined ||
      fullness.splits !== undefined ||
      fullness.pieces?.some((quarter): boolean => quarter.length > 0)
    )
      throw new Error("Measured toe support needs four native conic arcs");
    const { from, blendEnd } = extents;
    const length: number = tip - from;
    const first: number = original.stations[0]!;
    const read = (guide: Guide, radial: boolean = true): Law => {
      const source = Outline.create(guide, radial ? { top: tip } : {});
      if ("contract" in source) throw new Error(source.detail);
      return (x): Jet => {
        const station: number = radial ? tip - length * x * x : x;
        const row = Outline.at(source, Math.max(first, Math.min(tip, station)));
        if (typeof row === "string") throw new Error(row);
        if (!radial) return [row.value, ...row.parameterJet];
        return [
          row.value,
          row.parameterJet[0] * Math.sqrt(length),
          row.parameterJet[1] * length,
        ];
      };
    };
    const dimensions = [
      [original.front.negative, original.front.positive],
      [original.side.negative, original.side.positive],
    ] as const;
    const controls = dimensions.map(([low, high], axis) => {
      const a: Law = read(low),
        b: Law = read(high);
      const model = support(extents.rows, from, tip, axis);
      const lower: Law = (x): Jet =>
        combine(model.centre(x), model.width(x), -1);
      const upper: Law = (x): Jet => combine(model.centre(x), model.width(x));
      return {
        lower: emit(low, blend(a, lower)),
        upper: emit(high, blend(b, upper)),
        model,
      };
    });
    const touch = fullness.touch.map((guide, phase): Guide => {
      const { model } = controls[(phase + 1) % 2]!;
      const old: Law = read(guide);
      // ESTIMATE: a normalized touch approaches its ellipse-axis value as
      // the remaining physical span goes to zero. Keep actual source spread.
      const offset: number = averageAngular("touch", phase);
      const target: Law = (x): Jet =>
        combine(
          model.centre(x),
          multiply(model.width(x), [
            offset * x * x,
            2 * offset * x,
            2 * offset,
          ]),
        );
      return emit(guide, blend(old, target));
    }) as NonNullable<typeof fullness.touch>;
    const shoulders = fullness.shoulders.map((guide, phase): Guide => {
      const ellipse: number = Math.SQRT2 - 1;
      const delta: number = averageAngular("shoulder", phase) - ellipse;
      const limit: Law = (s): Jet => [
        ellipse + (delta * (tip - s)) / length,
        -delta / length,
        0,
      ];
      return emit(guide, blend(read(guide, false), limit, false), false);
    }) as typeof fullness.shoulders;
    return {
      ...original,
      front: { negative: controls[0]!.lower, positive: controls[0]!.upper },
      side: { negative: controls[1]!.lower, positive: controls[1]!.upper },
      fullness: { ...fullness, touch, shoulders },
    };

    /** Average admitted angular support with one nonnegative distance weight. */
    function averageAngular(key: "touch" | "shoulder", phase: number): number {
      let weights: number = 0;
      let total: number = 0;
      for (const { station, angular } of extents.rows) {
        if (angular === undefined || station >= tip) continue;
        const weight: number = tip - station;
        total += weight * angular[key][phase]!;
        weights += weight;
      }
      if (!(weights > 0)) throw new Error("Missing owned toe angular support");
      return total / weights;
    }

    function blend(a: Law, b: Law, radial: boolean = true): Law {
      return (x): Jet => {
        const station: number = radial ? tip - length * x * x : x;
        if (station >= blendEnd) return b(x);
        const before: Jet = a(x);
        if (station <= from) return before;
        const span: number = blendEnd - from;
        const t: number = (station - from) / span;
        const d: number = (radial ? -2 * length * x : 1) / span;
        const dd: number = (radial ? -2 * length : 0) / span;
        const step: number = 30 * t ** 2 * (1 - t) ** 2;
        return combine(
          before,
          multiply(combine(b(x), before, -1), [
            t ** 3 * (10 - 15 * t + 6 * t * t),
            step * d,
            60 * t * (1 - t) * (1 - 2 * t) * d * d + step * dd,
          ]),
        );
      };
    }

    function emit(guide: Guide, law: Law, radial: boolean = true): Guide {
      // A quintic with exact shared jets reproduces each untouched cubic
      // interval. Include the two Hermite blend limits as actual source knots.
      const stations: number[] = [
        ...new Set([
          ...guide.knots.map(({ station }): number => station),
          from,
          blendEnd,
        ]),
      ].sort((a, b): number => a - b);
      const span: number = radial
        ? Math.sqrt((tip - first) / length)
        : tip - first;
      return {
        ...guide,
        knots: stations.map((station, i): IAutoMovieViewPart.IKnot => {
          const [value, d, dd]: Jet = law(
            radial ? -Math.sqrt((tip - station) / length) : station,
          );
          return {
            site:
              guide.knots.find((k): boolean => k.station === station)?.site ??
              `tip.support.${i}`,
            station,
            value,
            jet: { first: d * span, second: dd * span * span },
          };
        }),
      };
    }
  }

  /** One smooth squared-distance centre law and a positive root-width law. */
  function support(
    rows: readonly Tips.IExtent[],
    from: number,
    tip: number,
    axis: number,
  ) {
    const controls = rows
      .filter(
        ({ station, stock }): boolean =>
          station >= from && station < tip && stock !== null,
      )
      .map(({ station, stock }) => {
        const t: number = (tip - station) / (tip - from);
        const low: number = stock![2 * axis]!;
        const high: number = stock![2 * axis + 1]!;
        return { t, centre: (low + high) / 2, width: (high - low) / 2 };
      });
    // The first anatomical centre term is O(t), and the first half width term
    // is O(sqrt(t)), giving a finite nonzero transverse pole differential.
    const centre: number[] = fitRows(
      controls.map(({ t, centre }) => ({
        row: [t, t * t],
        value: centre,
      })),
    );
    let width: number[] | undefined;
    for (const degree of [2, 1, 0]) {
      if (controls.length <= degree) continue;
      const fitted: number[] = fitRows(
        controls.map(({ t, width }) => ({
          row: (degree === 2
            ? [(1 - t) ** 2, 2 * t * (1 - t), t * t]
            : degree === 1
              ? [1 - t, t]
              : [1]
          ).map((b): number => b * Math.sqrt(t)),
          value: width,
        })),
      );
      if (fitted.every((coefficient): boolean => coefficient > 0)) {
        width = fitted;
        break;
      }
    }
    if (width === undefined)
      throw new Error("Source toe widths have no positive Bernstein support");
    const [a, middle = a, end = middle]: number[] = width;
    const b: number = width.length === 3 ? 2 * (middle! - a!) : middle! - a!;
    const c: number = width.length === 3 ? a! - 2 * middle! + end! : 0;
    return {
      centre: (x: number): Jet =>
        polynomial(x, [0, 0, centre[0]!, 0, centre[1]!]),
      width: (x: number): Jet => polynomial(x, [0, -a!, 0, -b, 0, -c]),
    };
  }

  /**
   * Reduce the real observations by Givens QR and solve the small triangular
   * system.
   */
  function fitRows(
    observations: readonly { row: number[]; value: number }[],
  ): number[] {
    const n: number = observations[0]?.row.length ?? 0;
    if (n === 0 || observations.length < n)
      throw new Error("Too few owned toe support sections");
    const reduced = reduceAutoMovieQrDesign(
      observations.map(({ row }): number[] => row),
      observations.map(({ value }): number => value),
      {
        maxEntries: n * (observations.length + n + 1),
        maxWork: observations.length * n * (n + 1),
      },
    );
    const result: number[] = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      const row: number[] = reduced.rows[i]!;
      let value: number = reduced.right[i]!;
      for (let j = i + 1; j < n; j++) value -= row[j]! * result[j]!;
      result[i] = value / row[i]!;
    }
    if (!result.every(Number.isFinite))
      throw new Error("Independent toe support basis is rank deficient");
    return result;
  }

  function polynomial(x: number, controls: readonly number[]): Jet {
    let value: number = 0,
      first: number = 0,
      second: number = 0;
    for (let i = controls.length - 1; i >= 0; i--) {
      second = second * x + 2 * first;
      first = first * x + value;
      value = value * x + controls[i]!;
    }
    return [value, first, second];
  }

  function combine(a: Jet, b: Jet, sign: number = 1, scale: number = 1): Jet {
    return [
      scale * (a[0] + sign * b[0]),
      scale * (a[1] + sign * b[1]),
      scale * (a[2] + sign * b[2]),
    ];
  }

  function multiply(a: Jet, b: Jet): Jet {
    return [
      a[0] * b[0],
      a[1] * b[0] + a[0] * b[1],
      a[2] * b[0] + 2 * a[1] * b[1] + a[0] * b[2],
    ];
  }
}
