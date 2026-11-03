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
    // The strongest four bones, the first met leading on a tie.
    const top: [number, number][] = [];
    pulls.forEach((w: number, slot: number): void => {
      if (w <= 0) return;
      let at: number = top.length;
      while (at > 0 && w > top[at - 1]![1]) at--;
      if (at === 4) return;
      top.splice(at, 0, [slot, w]);
      if (top.length > 4) top.pop();
    });
    const total: number = top.reduce(
      (a: number, e: [number, number]): number => a + e[1],
      0,
    );

    // The strongest takes the remainder of the rounding, so the weights sum to one.
    const rounded: [number, number][] = top
      .slice(1)
      .map(([b, w]: [number, number]): [number, number] => [
        b,
        Math.round((w / total) * STEPS) / STEPS,
      ]);
    const rest: number = rounded.reduce(
      (a: number, e: [number, number]): number => a + e[1],
      0,
    );
    return [
      [top[0]![0], Math.round((1 - rest) * STEPS) / STEPS],
      ...rounded,
    ];
  }
}
