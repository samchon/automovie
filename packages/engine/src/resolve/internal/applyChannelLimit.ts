import {
  IAutoMovieChannelLimit,
  type IAutoMovieClampOutcome,
  type IAutoMovieClampViolation,
} from "@automovie/interface";

import { channelKey } from "./channelKey";

/*
 * Clamp one sampled channel component-wise and report crossed bounds with
 * original values. Null bounds and omitted tails leave directions free;
 * sparse/nonfinite supplied bounds and reversed intervals throw. This does not
 * normalize a quaternion or impose coupled anatomical ROM.
 */
export function applyChannelLimit(
  value: number[],
  limit: IAutoMovieChannelLimit,
): IAutoMovieClampOutcome {
  const key: string = channelKey(limit.channel);
  validateFiniteBounds(limit.min, key, "min", value.length);
  validateFiniteBounds(limit.max, key, "max", value.length);
  validateOrderedBounds(limit.min, limit.max, key);

  const out: number[] = value.slice();
  const violations: IAutoMovieClampViolation[] = [];
  for (let i: number = 0; i < out.length; ++i) {
    const lo: number | null =
      limit.min === null ? null : (limit.min[i] ?? null);
    if (lo !== null && out[i]! < lo) {
      violations.push({
        component: i,
        bound: "min",
        limit: lo,
        actual: out[i]!,
      });
      out[i] = lo;
    }
    const hi: number | null =
      limit.max === null ? null : (limit.max[i] ?? null);
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
}

const validateFiniteBounds: (
  bounds: (number | null)[] | null,
  key: string,
  side: "min" | "max",
  width: number,
) => void = (
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
  }
};

const validateOrderedBounds: (
  min: (number | null)[] | null,
  max: (number | null)[] | null,
  key: string,
) => void = (
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
