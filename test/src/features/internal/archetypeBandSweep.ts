/**
 * Sweep seeds over one cited dimension of one archetype and report every way it leaves its band.
 *
 * The dimension is measured on the produced model at its own site, by the row's `measure`, never read from the producer's record of what it drew, and the band is the row's own statement of the cited values, so a producer whose band or geometry drifts from the citation fails here.
 *
 * Over `archetypeBandSweep.SEEDS` seeds every measured value must lie inside the band, and where the band has width the values must span at least `COVERAGE` of it: a producer that ignores its seed, or draws from a narrower band, fails the second.
 *
 * @param rows The dimensions to sweep.
 * @returns One line per finding, with the measured numbers; empty when every row holds.
 */
export function archetypeBandSweep(
  rows: readonly archetypeBandSweep.IRow[],
): string[] {
  const findings: string[] = [];
  for (const row of rows) {
    let low: number = Infinity;
    let high: number = -Infinity;
    const slack: number =
      row.tolerance ?? 1e-9 * Math.max(1, Math.abs(row.maximum));
    for (let seed: number = 0; seed < archetypeBandSweep.SEEDS; seed++) {
      const value: number = row.measure(seed);
      low = Math.min(low, value);
      high = Math.max(high, value);
    }
    if (!(low >= row.minimum - slack && high <= row.maximum + slack))
      findings.push(
        `${row.name}: measured ${low} to ${high}, outside ${row.minimum} to ${row.maximum} (${row.source})`,
      );
    else if (
      row.limit !== true &&
      row.maximum - row.minimum > 2 * slack &&
      high - low < archetypeBandSweep.COVERAGE * (row.maximum - row.minimum)
    )
      findings.push(
        `${row.name}: measured ${low} to ${high} covers less than ${archetypeBandSweep.COVERAGE} of ${row.minimum} to ${row.maximum} (${row.source})`,
      );
  }
  return findings;
}

/** Companion types and constants of {@link archetypeBandSweep}. */
export namespace archetypeBandSweep {
  /** How many seeds are swept: the 200 of the archetype campaign's acceptance law (#3365). */
  export const SEEDS: number = 200;

  /** The share of a band the swept values must span: the 80 % floor of #3368. A uniform draw of 200 values spans 99 % on average, so this fails only a producer that does not vary the dimension across its band. */
  export const COVERAGE: number = 0.8;

  /** One cited dimension of one archetype. */
  export interface IRow {
    /** What is measured, such as `office chair seat height`. */
    name: string;

    /** The dimension measured on the archetype produced for a seed, in the band's unit. */
    measure(seed: number): number;

    /** The least cited value. */
    minimum: number;

    /** The greatest cited value. */
    maximum: number;

    /** The citation. */
    source: string;

    /** True for a limit the dimension must respect without filling it, such as a code minimum with an open upper end; the coverage check is skipped. */
    limit?: boolean;

    /** Absolute slack on both ends, for a measure that goes through trigonometry; a billionth of the maximum when absent. */
    tolerance?: number;
  }
}
