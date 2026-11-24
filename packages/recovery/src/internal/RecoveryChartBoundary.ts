import type {
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMovieCubicBezierCurve64,
  IAutoMoviePolylineFit,
  IAutoMovieRecoveryChartBoundary,
} from "@automovie/interface";

import { RecoveryBezierFit as F } from "./RecoveryBezierFit";

/**
 * Own one fitted curve and accepted pointwise phase chart per private boundary
 * path. Private incidence words identify equality, including reversed order;
 * equal positions on different words never weld. Public boundary IDs are new
 * sequential identities. Each returned orientation uses the same canonical
 * coefficients and registration. Partial path overlaps remain distinct and
 * require a separate segmentation authority.
 */
export function RecoveryChartBoundary(
  policy: Parameters<IAutoMovieRecoveryChartBoundary.Operation>[0],
): ReturnType<IAutoMovieRecoveryChartBoundary.Operation> {
  type Value = {
    id: string;
    points: readonly Readonly<AutoMovieVector3Tuple>[];
    fit: IAutoMoviePolylineFit;
    parameters: number[];
    knots: number[];
  };
  const registry: Map<string, Value> = new Map();
  const corners: Map<
    string,
    { id: string; point: Readonly<AutoMovieVector3Tuple> }
  > = new Map();
  if (!(policy.cornerDegrees > 0 && policy.cornerDegrees < 180))
    throw new Error(
      "Boundary corner policy must lie strictly between zero and 180 degrees",
    );
  const get: ReturnType<IAutoMovieRecoveryChartBoundary.Operation>["get"] = (
    word: readonly string[],
    pointsMm: readonly Readonly<AutoMovieVector3Tuple>[],
  ): ReturnType<
    ReturnType<IAutoMovieRecoveryChartBoundary.Operation>["get"]
  > => {
    if (
      word.length !== pointsMm.length ||
      word.length < 2 ||
      word.some((id: string): boolean => !id)
    )
      throw new Error(
        "A complete private boundary word and physical observations are required",
      );
    const forward: string = JSON.stringify(word),
      backward: string = JSON.stringify([...word].reverse()),
      reversed: boolean = backward < forward,
      key: string = reversed ? backward : forward;
    const points: Readonly<AutoMovieVector3Tuple>[] = reversed
      ? [...pointsMm].reverse()
      : [...pointsMm];
    const cornerIds: [string, string] = [0, word.length - 1].map(
      (i: number): string => {
        const previous:
          | { id: string; point: Readonly<AutoMovieVector3Tuple> }
          | undefined = corners.get(word[i]!);
        if (
          previous &&
          previous.point.some(
            (x: number, k: number): boolean => x !== pointsMm[i]![k],
          )
        )
          throw new Error(
            "One private corner identity has conflicting physical observations",
          );
        const corner: { id: string; point: Readonly<AutoMovieVector3Tuple> } =
          previous ?? {
            id: `corner.${corners.size}`,
            point: pointsMm[i]!,
          };
        corners.set(word[i]!, corner);
        return corner.id;
      },
    ) as [string, string];
    let value: Value | undefined = registry.get(key);
    if (
      value &&
      value.points.some(
        (point: Readonly<AutoMovieVector3Tuple>, i: number): boolean =>
          point.some((x: number, k: number): boolean => x !== points[i]![k]),
      )
    )
      throw new Error(
        "One private boundary identity has conflicting physical observations",
      );
    if (!value) {
      const corners: number[] = [],
        accepted: {
          span: number;
          first: number;
          last: number;
          parameters: readonly number[];
        }[] = [];
      for (let i: number = 1; i + 1 < points.length; i++) {
        const a: number[] = points[i]!.map(
            (x: number, k: number): number => x - points[i - 1]![k]!,
          ),
          b: number[] = points[i + 1]!.map(
            (x: number, k: number): number => x - points[i]![k]!,
          );
        const denominator: number = Math.hypot(...a) * Math.hypot(...b);
        if (!(denominator > 0))
          throw new Error(
            "A private boundary observation edge is collapsed or unrepresentable",
          );
        const cosine: number =
          a.reduce(
            (sum: number, x: number, k: number): number => sum + x * b[k]!,
            0,
          ) / denominator;
        if (
          (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI >=
          policy.cornerDegrees
        )
          corners.push(i);
      }
      const id: string = `boundary.${registry.size}`,
        fit: IAutoMoviePolylineFit = F.fit(
          {
            name: id,
            pointsMm: points,
            closed: false,
            corners,
            toleranceMm: policy.toleranceMm,
            maxSpans: policy.maxSpans,
            parameterization: "chord",
          },
          (
            span: number,
            first: number,
            last: number,
            parameters: readonly number[],
          ): void => {
            accepted.push({ span, first, last, parameters });
          },
        );
      const total: number = fit.curve.phaseIntervals.reduce(
          (sum: number, width: number): number => sum + width,
          0,
        ),
        knots: number[] = [0];
      for (const width of fit.curve.phaseIntervals)
        knots.push(knots.at(-1)! + width / total);
      knots[knots.length - 1] = 1;
      const parameters: number[] = new Array(points.length).fill(NaN);
      for (const row of accepted)
        for (let i: number = row.first; i <= row.last; i++)
          parameters[i] =
            knots[row.span]! +
            (knots[row.span + 1]! - knots[row.span]!) *
              row.parameters[i - row.first]!;
      parameters[0] = 0;
      parameters[parameters.length - 1] = 1;
      if (
        parameters.some(
          (x: number, i: number): boolean => i > 0 && x <= parameters[i - 1]!,
        )
      )
        throw new Error(
          "The canonical boundary correspondence is not a strict normalized chart",
        );
      value = { id, points, fit, parameters, knots };
      registry.set(key, value);
    }
    const knots: number[] = reversed
      ? [...value.knots].reverse().map((x: number): number => 1 - x)
      : [...value.knots];
    const curve: IAutoMovieCubicBezierCurve64 = {
      ...value.fit.curve,
      phaseUnit: "normalized",
      phaseIntervals: knots
        .slice(1)
        .map((end: number, i: number): number => end - knots[i]!),
      spans: reversed
        ? [...value.fit.curve.spans]
            .reverse()
            .map(
              (
                span: AutoMovieCubicBezierControls3,
              ): AutoMovieCubicBezierControls3 => [
                span[3],
                span[2],
                span[1],
                span[0],
              ],
            )
        : value.fit.curve.spans,
    };
    const canonicalCurve: IAutoMovieCubicBezierCurve64 = {
      ...value.fit.curve,
      phaseUnit: "normalized",
      phaseIntervals: value.knots
        .slice(1)
        .map((end: number, i: number): number => end - value.knots[i]!),
    };
    return {
      id: value.id,
      reversed,
      corners: cornerIds,
      fit: { ...value.fit, curve },
      parameters: reversed
        ? [...value.parameters].reverse().map((x: number): number => 1 - x)
        : [...value.parameters],
      knots,
      canonicalCurve,
      canonicalKnots: [...value.knots],
    };
  };
  return { get, size: (): number => registry.size };
}
