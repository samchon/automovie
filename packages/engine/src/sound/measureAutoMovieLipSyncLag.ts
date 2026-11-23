import type { IAutoMovieMeasureLipSyncLag } from "@automovie/interface";

import { AUTOMOVIE_LIP_SYNC } from "./AUTOMOVIE_LIP_SYNC";

/**
 * Measure the lag between a speaker's mouth and a line's loudness by normalized
 * cross-correlation.
 *
 * Both series are standardized over the window to zero mean and unit variance.
 * For every integer lag `k` from `−W` to `W`, `W =
 * ceil(AUTOMOVIE_LIP_SYNC.windowSeconds × fps)`, the correlation is the mean of
 * `mouth[t] × level[t + k]` over the frames where both exist. The lag with the
 * highest correlation wins, the smaller `|k|` on a tie and then the negative
 * one. The verdict follows `AUTOMOVIE_LIP_SYNC`: inconclusive for a constant
 * series or a peak below the minimum, otherwise pass inside the BT.1359-1
 * window and fail outside it.
 *
 * @param props The two series over the same window and the film rate.
 * @returns The lag in frames and milliseconds, its correlation and the verdict.
 */
export function measureAutoMovieLipSyncLag(
  props: IAutoMovieMeasureLipSyncLag.IProps,
): IAutoMovieMeasureLipSyncLag.IResult {
  const length: number = props.mouth.length;
  if (
    props.level.length !== length ||
    !(props.fps > 0) ||
    !Number.isFinite(props.fps)
  )
    throw new Error(
      `A lip-sync measurement needs mouth and level series of one length and a positive rate, not ${length} and ${props.level.length} frames at ${props.fps} fps.`,
    );
  const mouth: Float64Array | null = standardize(props.mouth);
  const level: Float64Array | null = standardize(props.level);
  if (mouth === null || level === null)
    return {
      lagFrames: 0,
      lagMilliseconds: 0,
      correlation: 0,
      verdict: "inconclusive",
    };

  const reach: number = Math.ceil(AUTOMOVIE_LIP_SYNC.windowSeconds * props.fps);
  let best: { lag: number; correlation: number } = {
    lag: 0,
    correlation: -Infinity,
  };
  for (let step: number = 0; step <= reach; ++step)
    for (const lag of step === 0 ? [0] : [-step, step]) {
      let sum: number = 0;
      let count: number = 0;
      for (
        let t: number = Math.max(0, -lag);
        t < Math.min(length, length - lag);
        ++t
      ) {
        sum += mouth[t]! * level[t + lag]!;
        ++count;
      }
      const correlation: number = count === 0 ? -Infinity : sum / count;
      if (correlation > best.correlation) best = { lag, correlation };
    }

  const milliseconds: number = (best.lag * 1000) / props.fps;
  return {
    lagFrames: best.lag,
    lagMilliseconds: milliseconds,
    correlation: best.correlation,
    verdict:
      best.correlation < AUTOMOVIE_LIP_SYNC.minimumCorrelation
        ? "inconclusive"
        : milliseconds >= AUTOMOVIE_LIP_SYNC.leadMilliseconds &&
            milliseconds <= AUTOMOVIE_LIP_SYNC.lagMilliseconds
          ? "pass"
          : "fail",
  };
}

/**
 * Standardize a series to zero mean and unit variance, or return null for a
 * constant one; a non-finite value throws.
 */
const standardize: (series: ArrayLike<number>) => Float64Array | null = (
  series: ArrayLike<number>,
): Float64Array | null => {
  const length: number = series.length;
  let mean: number = 0;
  for (let index: number = 0; index < length; ++index) {
    if (!Number.isFinite(series[index]!))
      throw new Error(
        `A lip-sync series value at frame ${index} is not finite.`,
      );
    mean += series[index]! / length;
  }
  let variance: number = 0;
  for (let index: number = 0; index < length; ++index)
    variance += (series[index]! - mean) ** 2 / length;
  if (!(variance > 1e-24)) return null;
  const deviation: number = Math.sqrt(variance);
  return Float64Array.from(
    { length },
    (_: unknown, index: number): number => (series[index]! - mean) / deviation,
  );
};
