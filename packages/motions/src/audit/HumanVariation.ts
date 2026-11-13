/**
 * How much a quantity varies over seeds: build the same composition under
 * each seed, read one number from each, and report its spread. A film's
 * crowd must not move as clones, and no draw may leave its bounds; this is
 * the reading both are asserted on.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is measured, over what and why.
 * @evidence contracts/development/design.md#principled-representation A summary of one scalar over a list of seeds, independent of what the scalar is.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function and its report.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The reading is the caller's function of a seed, so nothing about a law is assumed.
 */
export namespace HumanVariation {
  /** The spread of one quantity over seeds. */
  export interface IReport {
    /** How many seeds were read. */
    count: number;

    /** The mean. */
    mean: number;

    /** The standard deviation (population). */
    deviation: number;

    /** The least value and its seed. */
    minimum: { value: number; seed: string };

    /** The greatest value and its seed. */
    maximum: { value: number; seed: string };

    /** The deviation over the mean's magnitude; 0 when the mean is 0. */
    coefficient: number;

    /** How many distinct values were read, to a part in a million of the range. */
    distinct: number;
  }

  /**
   * Read one quantity under each seed.
   *
   * @param seeds The seeds, or how many to generate (`seed-0`, `seed-1`, ...).
   * @param read The quantity under a seed, usually from a performance built with it.
   * @returns The report.
   * @throws {Error} When no seed is given.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the generated seed names and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The population mean and standard deviation over the readings; distinctness counted on values rounded to a millionth of the range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass to read, one to summarise.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every seed is read; none is sampled away.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the seeds, each costing what the caller's reading costs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds the readings until it returns.
   */
  export function over(
    seeds: readonly string[] | number,
    read: (seed: string) => number,
  ): IReport {
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
