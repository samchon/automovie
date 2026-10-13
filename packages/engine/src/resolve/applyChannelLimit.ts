import { IAutoMovieChannelLimit } from "@automovie/interface";

import { IAutoMovieClampOutcome } from "./IAutoMovieClampOutcome";
import { IAutoMovieClampViolation } from "./IAutoMovieClampViolation";
import { channelKey } from "./channelKey";

/**
 * Clamp one sampled channel component-wise and report crossed bounds with original values. Null bounds and omitted tails leave directions free; sparse/nonfinite supplied bounds and reversed intervals throw. This does not normalize a quaternion or impose coupled anatomical ROM.
 *
 * @evidence contracts/common.md#principled-implementation Validate finite values/bounds and ordered min/max, then project each component into its interval while recording the original crossing; null bounds preserve that direction.
 * @evidence contracts/common.md#clear-and-simple-design One component walk produces both usable values and correction causes, with channelKey sharing address identity with the resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Component clamping does not normalize quaternions or impose anatomical coupling; sparse/nonfinite bounds are refused rather than repaired with fixture values.
 * @evidence contracts/common.md#meaningful-documentation Docs explain nullable directions, output ownership, crossed-bound diagnostics and the component-space scope of this operation.
 * @evidence contracts/performance.md#efficient-algorithms W values and bound lengths require O(W+L) validation/projection, O(W) copied values and at most W admitted ordered-bound crossings.
 * @evidence contracts/performance.md#reuse-equivalent-work The resolver consumes the clamped values and violations together; altered values/limits require fresh comparisons and no mutable-result cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fresh output/diagnostic arrays; borrowed input values/limits survive success or refusal unchanged, and no handle or task is acquired.
 */
export const applyChannelLimit: (value: number[], limit: IAutoMovieChannelLimit) => IAutoMovieClampOutcome = (
  value: number[],
  limit: IAutoMovieChannelLimit,
): IAutoMovieClampOutcome => {
  const key: string = channelKey(limit.channel);
  validateFiniteValues(value, key);
  validateFiniteBounds(limit.min, key, "min", value.length);
  validateFiniteBounds(limit.max, key, "max", value.length);
  validateOrderedBounds(limit.min, limit.max, key);

  const out: number[] = value.slice();
  const violations: IAutoMovieClampViolation[] = [];
  for (let i: number = 0; i < out.length; ++i) {
    const lo: number | null = limit.min === null ? null : (limit.min[i] ?? null);
    if (lo !== null && out[i]! < lo) {
      violations.push({
        component: i,
        bound: "min",
        limit: lo,
        actual: out[i]!,
      });
      out[i] = lo;
    }
    const hi: number | null = limit.max === null ? null : (limit.max[i] ?? null);
    if (hi !== null && out[i]! > hi) {
      violations.push({
        component: i,
        bound: "max",
        limit: hi,
        actual: out[i]!,
      });
      out[i] = hi;
    }
  }
  return { value: out, violations };
};

const validateFiniteValues: (value: number[], key: string) => void = (value: number[], key: string): void => {
  for (let i: number = 0; i < value.length; ++i)
    if (!Number.isFinite(value[i]!))
      throw new Error(
        `channel limit "${key}" value[${i}] must be finite, but was ${value[i]!}`,
      );
};

const validateFiniteBounds: (bounds: (number | null)[] | null, key: string, side: "min" | "max", width: number) => void = (
  bounds: (number | null)[] | null,
  key: string,
  side: "min" | "max",
  width: number,
): void => {
  if (bounds === null) return;
  for (let i: number = 0; i < bounds.length; ++i) {
    const bound: number | null = bounds[i];
    if (bound === null) continue;
    if (i >= width)
      throw new Error(
        `channel limit "${key}" ${side}[${i}] is outside value width ${width}, but was ${bound}`,
      );
    if (!Number.isFinite(bound))
      throw new Error(
        `channel limit "${key}" ${side}[${i}] must be finite, but was ${bound}`,
      );
  }
};

const validateOrderedBounds: (min: (number | null)[] | null, max: (number | null)[] | null, key: string) => void = (
  min: (number | null)[] | null,
  max: (number | null)[] | null,
  key: string,
): void => {
  if (min === null || max === null) return;
  const length: number = Math.max(min.length, max.length);
  for (let i: number = 0; i < length; ++i) {
    const lo: number | null = min[i] ?? null;
    const hi: number | null = max[i] ?? null;
    if (lo !== null && hi !== null && lo > hi)
      throw new Error(
        `channel limit "${key}" min[${i}] must be <= max[${i}], but was ${lo} > ${hi}`,
      );
  }
};
