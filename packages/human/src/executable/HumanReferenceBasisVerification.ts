import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import type { IAutoMovieRecoveryHermiteCurve as H } from "@automovie/recovery";

/** Independent coefficient-publication checks; this observer never supplies generation or fitting. */
export namespace HumanReferenceBasisVerification {
  /** Complete pair traversal, with derivative errors in the original parameter units. */
  export interface Result {
    /** Every original curve, including open arcs and nested metadata occurrences. */
    curves: number;

    /** Every actual original phase interval. */
    spans: number;

    /** Point, first derivative and second derivative maximum absolute component errors. */
    maximumErrors: [number, number, number];

    /** Largest error divided by its binary64 operation-count envelope. */
    maximumEnvelopeRatio: number;
  }

  /**
   * Traverse all metadata and compare the two analytic bases at five local parameters per span.
   * The error envelope is 128 epsilon times the sum of endpoint/handle term magnitudes, with
   * each derivative's actual width scaling. This checks rounding, not a source fitting tolerance.
   * Closure, orientation, names, domains, fit reports and all other metadata must compare exactly.
   */
  export function inspect(original: unknown, converted: unknown): Result {
    const result: Result = {
      curves: 0,
      spans: 0,
      maximumErrors: [0, 0, 0],
      maximumEnvelopeRatio: 0,
    };

    /** Recursion changes only the cubic discriminant and coefficients; all other leaves must agree. */
    const visit: (before: unknown, after: unknown) => void = (
      before: unknown,
      after: unknown,
    ): void => {
      if (before === null || typeof before !== "object") {
        if (before !== after)
          throw new Error(
            "Reference metadata changed during basis publication",
          );
        return;
      }
      if (
        after === null ||
        typeof after !== "object" ||
        Array.isArray(before) !== Array.isArray(after)
      )
        throw new Error(
          "Reference metadata structure changed during basis publication",
        );
      const first: Record<string, unknown> = before as Record<string, unknown>;
      const second: Record<string, unknown> = after as Record<string, unknown>;
      const keys: string[] = Object.keys(first);
      if (
        keys.length !== Object.keys(second).length ||
        keys.some((key: string): boolean => !Object.hasOwn(second, key))
      )
        throw new Error(
          "Reference metadata keys changed during basis publication",
        );
      if (first.type === "cubicHermite") {
        if (second.type !== "cubicBezier")
          throw new Error("Expected the exact cubic Bezier basis");
        const source: H = before as H;
        const target: C.Cubic = after as C.Cubic;
        if (source.spans.length !== target.spans.length)
          throw new Error("Original span count changed");
        result.curves++;
        result.spans += source.spans.length;
        for (let index: number = 0; index < source.spans.length; index++)
          compare(
            source.spans[index]!,
            target.spans[index]!,
            source.phaseIntervals[index]!,
            result,
          );
        for (const key of keys)
          if (key !== "type" && key !== "spans") visit(first[key], second[key]);
        return;
      }
      for (const key of keys) visit(first[key], second[key]);
    };
    visit(original, converted);
    return result;
  }

  /** Analytic Hermite and Bernstein bases, differentiated independently in the same phase chart. */
  function compare(
    source: H["spans"][number],
    target: C.Span,
    width: number,
    result: Result,
  ): void {
    if (!(width > 0 && Number.isFinite(width)))
      throw new Error("Invalid original phase width");
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const hermite: number[][] = [
        [
          2 * t ** 3 - 3 * t ** 2 + 1,
          t ** 3 - 2 * t ** 2 + t,
          -2 * t ** 3 + 3 * t ** 2,
          t ** 3 - t ** 2,
        ],
        [
          6 * t ** 2 - 6 * t,
          3 * t ** 2 - 4 * t + 1,
          -6 * t ** 2 + 6 * t,
          3 * t ** 2 - 2 * t,
        ],
        [12 * t - 6, 6 * t - 4, -12 * t + 6, 6 * t - 2],
      ];
      const bernstein: number[][] = [
        [(1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t ** 2, t ** 3],
        [
          -3 * (1 - t) ** 2,
          3 * (1 - t) ** 2 - 6 * (1 - t) * t,
          6 * (1 - t) * t - 3 * t ** 2,
          3 * t ** 2,
        ],
        [6 * (1 - t), 18 * t - 12, 6 - 18 * t, 6 * t],
      ];
      for (let order: number = 0; order <= 2; order++)
        for (let axis: number = 0; axis < 3; axis++) {
          const coefficients: number[] = [
            source.start[axis]!,
            width * source.startDerivative[axis]!,
            source.end[axis]!,
            width * source.endDerivative[axis]!,
          ];
          let a: number = 0;
          let b: number = 0;
          let magnitude: number = 0;
          for (let control: number = 0; control < 4; control++) {
            a += hermite[order]![control]! * coefficients[control]!;
            b += bernstein[order]![control]! * target[control]![axis]!;
            magnitude +=
              Math.abs(coefficients[control]!) +
              Math.abs(target[control]![axis]!);
          }
          const scale: number = width ** order;
          const error: number = Math.abs(a / scale - b / scale);
          const envelope: number =
            (128 * Number.EPSILON * Math.max(1, magnitude)) / scale;
          const ratio: number = error / envelope;
          if (
            ![a / scale, b / scale, error, envelope, ratio].every(
              Number.isFinite,
            ) ||
            ratio > 1
          )
            throw new Error(
              "Saved cubic position/derivative changed beyond its binary64 envelope",
            );
          result.maximumErrors[order] = Math.max(
            result.maximumErrors[order]!,
            error,
          );
          result.maximumEnvelopeRatio = Math.max(
            result.maximumEnvelopeRatio,
            ratio,
          );
        }
    }
  }
}
