/**
 * The last step of a binding: the strongest four bones of a point, in
 * thousandths.
 *
 * A mesh skin carries four influences per vertex, and every weight travels as
 * text to the page, so a thousandth of a bone's pull is below what a skin can
 * show. The strongest bone takes the remainder of the rounding and the others
 * stay short, so the four always sum to one.
 */
export namespace AutoMovieHumanBindingQuantize {
  /** Steps of a weight. */
  export const STEPS: number = 1000;

  /**
   * The strongest four influences of a point, normalized.
   *
   * @param pulls Each bone's pull by slot; non-positive entries are absent.
   * @returns Four `[slot, weight]` pairs, strongest first, summing to one; fewer when fewer bones pull.
   */
  export function strongest(pulls: Float64Array): [number, number][] {
    // The strongest four bones, the first met leading on a tie, kept in
    // order by insertion (one point at a time, so the buffers are reused).
    let n: number = 0;
    for (let slot: number = 0; slot < pulls.length; slot++) {
      const w: number = pulls[slot]!;
      if (w <= 0) continue;
      let at: number = n;
      while (at > 0 && w > WEIGHTS[at - 1]!) at--;
      if (at === 4) continue;
      for (let k: number = Math.min(n, 3); k > at; k--) {
        SLOTS[k] = SLOTS[k - 1]!;
        WEIGHTS[k] = WEIGHTS[k - 1]!;
      }
      SLOTS[at] = slot;
      WEIGHTS[at] = w;
      if (n < 4) n++;
    }
    if (n === 0) throw new TypeError("A binding point has no bone pulling it");
    let total: number = 0;
    for (let k: number = 0; k < n; k++) total += WEIGHTS[k]!;

    // The strongest takes the remainder of the rounding, so the weights sum to one.
    const out: [number, number][] = [[SLOTS[0]!, 0]];
    let rest: number = 0;
    for (let k: number = 1; k < n; k++) {
      const r: number = Math.round((WEIGHTS[k]! / total) * STEPS) / STEPS;
      out.push([SLOTS[k]!, r]);
      rest += r;
    }
    out[0]![1] = Math.round((1 - rest) * STEPS) / STEPS;
    return out;
  }

  /** The strongest bones' slots while a point is read. */
  const SLOTS: Int32Array = new Int32Array(4);

  /** Their pulls, in the same order. */
  const WEIGHTS: Float64Array = new Float64Array(4);
}
