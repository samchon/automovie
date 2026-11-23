import type { IAutoMovieMotionHumanVariation } from "@automovie/interface";

/**
 * How much a quantity varies over seeds: build the same composition under
 * each seed, read one number from each, and report its spread. A film's
 * crowd must not move as clones, and no draw may leave its bounds; this is
 * the reading both are asserted on.
 */
export namespace HumanVariation {
  /**
   * Read one quantity under each seed.
   *
   * @param seeds The seeds, or how many to generate (`seed-0`, `seed-1`, ...).
   * @param read The quantity under a seed, usually from a performance built with it.
   * @returns The report.
   * @throws {Error} When no seed is given.
   */
  export function over(
    seeds: readonly string[] | number,
    read: (seed: string) => number,
  ): IAutoMovieMotionHumanVariation.IReport {
    const names: readonly string[] =
      typeof seeds === "number"
        ? Array.from({ length: seeds }, (_, index: number) => `seed-${index}`)
        : seeds;
    if (names.length === 0) throw new Error("A variation needs a seed");
    const values: number[] = names.map(read);
    const mean: number =
      values.reduce((sum: number, value: number): number => sum + value, 0) /
      values.length;
    const deviation: number = Math.sqrt(
      values.reduce(
        (sum: number, value: number): number => sum + (value - mean) ** 2,
        0,
      ) / values.length,
    );
    let low: number = 0;
    let high: number = 0;
    values.forEach((value: number, index: number): void => {
      if (value < values[low]!) low = index;
      if (value > values[high]!) high = index;
    });
    const range: number = values[high]! - values[low]!;
    return {
      count: values.length,
      mean,
      deviation,
      minimum: { value: values[low]!, seed: names[low]! },
      maximum: { value: values[high]!, seed: names[high]! },
      coefficient: mean === 0 ? 0 : deviation / Math.abs(mean),
      distinct:
        range === 0
          ? 1
          : new Set(
              values.map((value: number): number =>
                Math.round(((value - values[low]!) / range) * 1e6),
              ),
            ).size,
    };
  }
}
