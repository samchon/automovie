/**
 * A covering array: rows of factor values in which every combination of `t`
 * values of any `t` factors appears in at least one row.
 *
 * Most faults are triggered by one factor or by the interaction of two or
 * three (Kuhn, Kacker and Lei 2010, NIST SP 800-142, Practical Combinatorial
 * Testing: 96 % within two factors in their data, nearly all within six), so
 * a sweep that covers every pair or triple of values reaches what the full
 * Cartesian product would with a small share of its rows. The rows are built
 * greedily in the manner of AETG (Cohen, Dalal, Fredman and Patton 1997, IEEE
 * Trans Softw Eng 23:437): each row starts from the first tuple still
 * uncovered and takes, factor by factor, the value that covers the most
 * uncovered tuples, ties to the earlier value, so the array is deterministic.
 *
 * @param factors Each factor's values, in a stable order.
 * @param t The strength, 1 to the number of factors.
 * @returns The rows, each a value per factor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is covered, why the strength suffices, the construction and its determinism.
 * @evidence contracts/development/implementation.md#principled-implementation The greedy one-row-at-a-time construction of AETG over the set of uncovered t-tuples.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One tuple enumeration, one loop building a row, one coverage update.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every t-tuple is enumerated and the loop ends only when none is uncovered; a strength larger than the factors is reduced to their count.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each value choice scans the uncovered tuples it could close; the arrays here have a few hundred rows over a handful of factors.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function motionCoveringArray(
  factors: Readonly<Record<string, readonly string[]>>,
  t: number,
): Record<string, string>[] {
  const names: string[] = Object.keys(factors).filter(
    (n: string): boolean => factors[n]!.length > 0,
  );
  const strength: number = Math.max(1, Math.min(t, names.length));
  // Every t-subset of factors, and every value tuple over it, uncovered.
  const subsets: number[][] = [];
  const choose = (from: number, picked: number[]): void => {
    if (picked.length === strength) {
      subsets.push([...picked]);
      return;
    }
    for (let i: number = from; i < names.length; i++)
      choose(i + 1, [...picked, i]);
  };
  choose(0, []);
  const key = (subset: number[], values: string[]): string =>
    subset.map((f: number, i: number): string => `${f}=${values[i]}`).join("|");
  const uncovered: Map<string, { subset: number[]; values: string[] }> =
    new Map();
  for (const subset of subsets) {
    const product = (i: number, values: string[]): void => {
      if (i === subset.length) {
        uncovered.set(key(subset, values), { subset, values: [...values] });
        return;
      }
      for (const v of factors[names[subset[i]!]!]!)
        product(i + 1, [...values, v]);
    };
    product(0, []);
  }
  const covers = (
    row: (string | undefined)[],
    subset: number[],
  ): string | undefined => {
    const values: string[] = [];
    for (const f of subset) {
      const v: string | undefined = row[f];
      if (v === undefined) return undefined;
      values.push(v);
    }
    return key(subset, values);
  };
  const rows: Record<string, string>[] = [];
  while (uncovered.size > 0) {
    const first = uncovered.values().next().value!;
    const row: (string | undefined)[] = names.map(() => undefined);
    first.subset.forEach((f: number, i: number): void => {
      row[f] = first.values[i];
    });
    for (let f: number = 0; f < names.length; f++) {
      if (row[f] !== undefined) continue;
      let best: string = factors[names[f]!]![0]!;
      let most: number = -1;
      for (const v of factors[names[f]!]!) {
        row[f] = v;
        let gained: number = 0;
        for (const subset of subsets) {
          if (!subset.includes(f)) continue;
          const k: string | undefined = covers(row, subset);
          if (k !== undefined && uncovered.has(k)) gained++;
        }
        if (gained > most) {
          most = gained;
          best = v;
        }
      }
      row[f] = best;
    }
    for (const subset of subsets) uncovered.delete(covers(row, subset)!);
    rows.push(
      Object.fromEntries(names.map((n: string, i: number) => [n, row[i]!])),
    );
  }
  return rows;
}
