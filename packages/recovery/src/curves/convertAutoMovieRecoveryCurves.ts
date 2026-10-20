import {
  type IAutoMovieCurve64 as C,
  AutoMovieCurveMath64 as M,
} from "@automovie/engine/geometry/curve";

import { rebindRecoveryCurveAuthorities } from "../internal/rebindRecoveryCurveAuthorities";
import type { IAutoMovieRecoveryHermiteCurve } from "../structures/curve/IAutoMovieRecoveryHermiteCurve";
import type { IAutoMovieRecoveryHermiteSpan } from "../structures/curve/IAutoMovieRecoveryHermiteSpan";
import type { AutoMovieRecoveryCurveData } from "../typings/AutoMovieRecoveryCurveData";
import type { AutoMovieRecoveryCurveFormat } from "../typings/AutoMovieRecoveryCurveFormat";

/**
 * Copy a plain saved recovery artifact into the selected cubic coefficient basis.
 * Every nested cubic occurrence is converted, including open arcs and overrides.
 * Original phase widths, directions, names and metadata survive unchanged. Endpoint
 * derivatives are 3(B1-B0)/h and 3(B3-B2)/h; inverse handles multiply by h/3.
 * This is an algebraic basis change in real arithmetic, with binary64 rounding,
 * not fitting or a bitwise round-trip guarantee. Invalid widths, nonfinite converted coefficients,
 * cycles, and noncubic or rational curves requested as Hermite refuse conversion.
 * Recognized cubic records are validated in either basis before arithmetic. Surface nets
 * retain their own representation. Plain metadata must have no accessors or hosts.
 *
 * @evidence contracts/common.md#principled-implementation The engine's endpoint derivative and inverse Hermite operators preserve the supplied cubic chart; complete curve records are recognized before recursive metadata copying.
 * @evidence contracts/common.md#clear-and-simple-design One package function supplies API and CLI publication without filesystem or specimen-specific adapters.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No resampling, tangent normalization, vertical-distance width, degree reduction, source mesh or fallback coefficient table is used.
 * @evidence contracts/common.md#meaningful-documentation States equations, units, ownership, finite arithmetic, supported degree, shared references and refusal conditions.
 * @evidence contracts/performance.md#efficient-algorithms A traversal costs O(N+S) time and output storage for N metadata entries and S spans; constant arithmetic converts each span.
 * @evidence contracts/performance.md#reuse-equivalent-work A call-local identity map converts shared data once, preserving alias identity without caching across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs remain borrowed and unmodified; copied data transfer to the caller and traversal maps expire on return or failure. Recursion depth follows input depth and is not independently bounded.
 */
export function convertAutoMovieRecoveryCurves<
  T,
  Format extends AutoMovieRecoveryCurveFormat,
>(input: T, format: Format): AutoMovieRecoveryCurveData<T, Format> {
  if (format !== "bezier" && format !== "hermite")
    throw new Error("Curve format must be bezier or hermite");
  const copies: WeakMap<object, object> = new WeakMap();
  const active: WeakSet<object> = new WeakSet();
  const visit: (value: unknown) => unknown = (value: unknown): unknown => {
    if (
      typeof value === "function" ||
      typeof value === "symbol" ||
      typeof value === "bigint"
    )
      throw new Error(
        "Saved curve data must not contain executable or non-JSON values",
      );
    if (value === null || typeof value !== "object") return value;
    if (active.has(value)) throw new Error("Saved curve data must be acyclic");
    const previous: object | undefined = copies.get(value);
    if (previous) return previous;
    const array: boolean = Array.isArray(value);
    const prototype: object | null = Object.getPrototypeOf(value);
    if (
      array
        ? prototype !== Array.prototype
        : prototype !== Object.prototype && prototype !== null
    )
      throw new Error("Saved curve data must contain plain objects and arrays");
    if (Object.getOwnPropertySymbols(value).length !== 0)
      throw new Error("Saved curve data must contain string data properties");
    active.add(value);
    const result: unknown[] | { [key: string]: unknown } = array ? [] : {};
    copies.set(value, result);
    const keys: string[] = Object.getOwnPropertyNames(value);
    if (array && keys.length !== (value as unknown[]).length + 1)
      throw new Error(
        "Saved curve arrays must be dense without additional properties",
      );
    for (const key of keys) {
      if (array && key === "length") continue;
      const descriptor: PropertyDescriptor | undefined =
        Object.getOwnPropertyDescriptor(value, key);
      if (
        !descriptor ||
        !Object.hasOwn(descriptor, "value") ||
        !descriptor.enumerable
      )
        throw new Error(
          "Saved curve data must contain enumerable own data properties",
        );
      if (
        array &&
        (!/^(0|[1-9][0-9]*)$/.test(key) ||
          Number(key) >= (value as unknown[]).length)
      )
        throw new Error(
          "Saved curve arrays must contain only dense indexed data",
        );
      Object.defineProperty(result, key, {
        value: visit(descriptor.value),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    const record: { [key: string]: unknown } = result as {
      [key: string]: unknown;
    };
    const cubic: boolean =
      record.type === "cubicBezier" || record.type === "cubicHermite";
    if (
      format === "hermite" &&
      (record.type === "bernstein" || record.type === "analyticOval")
    )
      throw new Error(
        "Only cubic polynomial curves support this basis selection",
      );
    if (cubic) {
      if (
        typeof record.name !== "string" ||
        typeof record.closed !== "boolean" ||
        record.unit !== "mm" ||
        !["turn", "mm", "normalized"].includes(record.phaseUnit as string) ||
        !Array.isArray(record.spans) ||
        record.spans.length === 0 ||
        !Array.isArray(record.phaseIntervals) ||
        record.phaseIntervals.length !== record.spans.length ||
        !record.phaseIntervals.every(
          (width: unknown): boolean =>
            typeof width === "number" && width > 0 && Number.isFinite(width),
        )
      )
        throw new Error(
          "Finite cubic spans and their original positive phase widths are required",
        );
      const curve: C.Cubic | IAutoMovieRecoveryHermiteCurve =
        result as unknown as C.Cubic | IAutoMovieRecoveryHermiteCurve;
      const vector: (point: unknown) => point is C.Vector = (
        point: unknown,
      ): point is C.Vector =>
        Array.isArray(point) &&
        point.length === 3 &&
        point.every(
          (component: unknown): boolean =>
            typeof component === "number" && Number.isFinite(component),
        );
      const spans: (C.Span | IAutoMovieRecoveryHermiteSpan)[] = curve.spans.map(
        (
          span: C.Span | IAutoMovieRecoveryHermiteSpan,
          index: number,
        ): C.Span | IAutoMovieRecoveryHermiteSpan => {
          const width: number = curve.phaseIntervals[index]!;
          let endpoints: IAutoMovieRecoveryHermiteSpan;
          if (curve.type === "cubicBezier") {
            if (
              !Array.isArray(span) ||
              span.length !== 4 ||
              !span.every(vector)
            )
              throw new Error(
                "Four finite three-dimensional Bernstein controls are required",
              );
            if (format === "bezier") return span as C.Span;
            endpoints = M.toHermite(span as C.Span, width);
          } else {
            const saved: IAutoMovieRecoveryHermiteSpan =
              span as IAutoMovieRecoveryHermiteSpan;
            if (
              !saved ||
              ![
                saved.start,
                saved.end,
                saved.startDerivative,
                saved.endDerivative,
              ].every(vector)
            )
              throw new Error(
                "Finite Hermite endpoints and derivatives are required",
              );
            endpoints = saved;
          }
          if (
            ![
              endpoints.start,
              endpoints.end,
              endpoints.startDerivative,
              endpoints.endDerivative,
            ].every(vector)
          )
            throw new Error(
              "Cubic basis conversion exceeds finite binary64 coefficients",
            );
          if (format === "hermite") return endpoints;
          const controls: C.Span = M.hermite(
            M.clone(endpoints.start),
            M.clone(endpoints.end),
            M.clone(endpoints.startDerivative),
            M.clone(endpoints.endDerivative),
            width,
          );
          if (!controls.every(vector))
            throw new Error(
              "Cubic basis conversion exceeds finite binary64 coefficients",
            );
          return controls;
        },
      );
      Object.assign(result, {
        type: format === "hermite" ? "cubicHermite" : "cubicBezier",
        spans,
      });
    }
    active.delete(value);
    return result;
  };
  const result: AutoMovieRecoveryCurveData<T, Format> = visit(
    input,
  ) as AutoMovieRecoveryCurveData<T, Format>;
  rebindRecoveryCurveAuthorities(input, result, format);
  return result;
}
