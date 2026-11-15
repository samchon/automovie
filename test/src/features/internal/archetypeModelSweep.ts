/**
 * Sweep seeds over one picked axis of one archetype and report every way it leaves its read models.
 *
 * The figures are measured on the produced model, by the row's `measure`, never read from the producer's record of what it picked, and the models are the row's own statement of the read figures, so a producer that blends two models, builds one between them or never picks one fails here.
 *
 * Over `archetypeModelSweep.SEEDS` seeds every measured tuple must equal one model's figures within the row's tolerance, and every model must be drawn at least once.
 *
 * @param rows The axes to sweep.
 * @returns One line per finding, with the measured numbers; empty when every row holds.
 */
export function archetypeModelSweep(
  rows: readonly archetypeModelSweep.IRow[],
): string[] {
  const findings: string[] = [];
  for (const row of rows) {
    const drawn: Set<number> = new Set();
    for (let seed: number = 0; seed < archetypeModelSweep.SEEDS; seed++) {
      const measured: readonly number[] = row.measure(seed);
      const index: number = row.models.findIndex(
        (model: readonly number[]): boolean =>
          model.length === measured.length &&
          model.every(
            (figure: number, k: number): boolean =>
              Math.abs(figure - measured[k]!) <=
              (row.tolerance ?? 1e-9 * Math.max(1, Math.abs(figure))),
          ),
      );
      if (index < 0)
        findings.push(
          `${row.name}: seed ${seed} measured ${measured.join(", ")}, none of the read models (${row.source})`,
        );
      else drawn.add(index);
    }
    if (drawn.size !== row.models.length)
      findings.push(
        `${row.name}: ${archetypeModelSweep.SEEDS} seeds drew ${drawn.size} of ${row.models.length} read models (${row.source})`,
      );
  }
  return findings;
}

/** Companion types and constants of {@link archetypeModelSweep}. */
export namespace archetypeModelSweep {
  /** How many seeds are swept: the 200 of the archetype campaign's acceptance law (#3365). */
  export const SEEDS: number = 200;

  /** One picked axis of one archetype. */
  export interface IRow {
    /** What is measured, such as `wall mirror size`. */
    name: string;

    /** The figures measured on the archetype produced for a seed, in the order each model lists them. */
    measure(seed: number): readonly number[];

    /** Each read model's figures, in the measured order. */
    models: readonly (readonly number[])[];

    /** The citation. */
    source: string;

    /** Absolute slack on every figure, for a measure that goes through trigonometry; a billionth of the figure when absent. */
    tolerance?: number;
  }
}
