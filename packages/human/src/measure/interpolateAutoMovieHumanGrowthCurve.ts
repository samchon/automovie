import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";

/**
 * Read a growth curve at an age by linear interpolation between its samples.
 *
 * Before the first sample age the first value holds, after the last the last value holds, and between two samples the value moves on the straight line joining them. The result is continuous in age and exact at every sample, which is what a deterministic converter needs: the same age always gives the same value, and two neighbouring ages never jump.
 *
 * @param curve Samples with strictly increasing ages
 * @param age Age in years, any finite value
 * @returns The interpolated value in the curve's unit
 */
export function interpolateAutoMovieHumanGrowthCurve(
  curve: IAutoMovieHumanGrowthCurve,
  age: number,
): number {
  const { ages, values }: IAutoMovieHumanGrowthCurve = curve;
  if (age <= ages[0]!) return values[0]!;
  for (let i: number = 1; i < ages.length; ++i) {
    const upper: number = ages[i]!;
    if (age <= upper) {
      const lower: number = ages[i - 1]!;
      const t: number = (age - lower) / (upper - lower);
      return values[i - 1]! + t * (values[i]! - values[i - 1]!);
    }
  }
  return values[values.length - 1]!;
}
