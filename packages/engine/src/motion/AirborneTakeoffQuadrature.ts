import { AirborneQuadratureAggregate } from "./AirborneQuadratureAggregate";

/**
 * Adaptive Simpson integration of a shooting seed's vector integrand.
 *
 * A panel compares one Simpson rule with two half-panel rules. Their difference
 * divided by 15 estimates the refined rule's error, and the same Richardson
 * correction forms its value (Gander and Gautschi, Adaptive
 * Quadrature--Revisited, BIT 40 (2000), 84--101,
 * https://www.cs.purdue.edu/homes/wxg/selected_works/section_07/160.pdf). The
 * caller measures each panel's componentwise absolute estimates in its output's
 * unit. Those measured errors are summed, and the panel with the largest error
 * is split until the global estimate meets the budget. A panel component whose
 * error added to that component's magnitude (the coarse integral of its
 * absolute value) leaves it unchanged in floating point is resolved and counts
 * no error, Gander and Gautschi's termination test: no refinement can move the
 * computed sum there. So a budget below the arithmetic's resolution ends once
 * every panel is resolved, instead of splitting every panel toward machine
 * width.
 *
 * @param props The finite interval, pure integrand, output-error measure and
 *   budget.
 * @returns The Richardson-corrected integral vector.
 * @throws {Error} When data are non-finite, dimensions change, the budget is
 *   invalid, or a required panel cannot be bisected at machine resolution.
 */
export function AirborneTakeoffQuadrature(props: {
  /** Interval start, seconds. */
  t0: number;

  /** Interval end after t0, seconds. */
  t1: number;

  /** Pure finite integrand with one fixed positive vector dimension. */
  read: (seconds: number) => readonly number[];

  /** Nonnegative output-error budget in the measure's unit. */
  tolerance: number;

  /**
   * Pure nonnegative norm-like measure of one panel's absolute component
   * errors, using the current whole integral. Infinity requests refinement; NaN
   * and negative errors are invalid.
   */
  error: (value: readonly number[], error: readonly number[]) => number;

  /**
   * Optional exact decomposition
   * error(value,e)=dot(weights(value),components(e)), with nonnegative
   * fixed-dimension coordinates. The caller owns this mathematical premise;
   * arbitrary measures retain the original full scan. Current weights are
   * recomputed after every split and aggregate-addition roundoff is charged
   * through error.
   */
  separable?: {
    /**
     * Fixed nonnegative panel-error coordinates independent of the whole
     * integral.
     */
    components: (error: readonly number[]) => readonly number[];
    /** Current nonnegative coordinate weights, recomputed once per integral. */
    weights: (value: readonly number[]) => readonly number[];
  };
}): number[] {
  /** One leaf's samples, half rules and corrected integral/error vectors. */
  interface IPanel {
    /** Start, seconds. */
    a: number;

    /** End, seconds. */
    b: number;

    /** Integrand at a. */
    fa: readonly number[];

    /** Integrand at the midpoint. */
    fm: readonly number[];

    /** Integrand at b. */
    fb: readonly number[];

    /** Integrand at the first quarter. */
    fl: readonly number[];

    /** Integrand at the third quarter. */
    fr: readonly number[];

    /** Left half's Simpson integral. */
    left: number[];

    /** Right half's Simpson integral. */
    right: number[];

    /** Richardson-corrected integral. */
    value: number[];

    /** Absolute componentwise Richardson error estimates. */
    error: number[];
  }
  if (
    !(
      props.t1 > props.t0
    )
  )
    throw new Error(
      "AirborneTakeoffQuadrature needs a finite forward interval",
    );
  if (!(props.tolerance >= 0))
    throw new Error(
      "AirborneTakeoffQuadrature needs a finite nonnegative error budget",
    );
  let dimensions: number | undefined;
  const read: (t: number) => readonly number[] = (
    t: number,
  ): readonly number[] => {
    const value: readonly number[] = props.read(t);
    dimensions ??= value.length;
    if (dimensions === 0 || value.length !== dimensions)
      throw new Error(
        `AirborneTakeoffQuadrature needs a nonempty fixed-dimension vector at ${t} s`,
      );
    return [...value];
  };
  const simpson: (
    a: number,
    b: number,
    fa: readonly number[],
    fm: readonly number[],
    fb: readonly number[],
  ) => number[] = (
    a: number,
    b: number,
    fa: readonly number[],
    fm: readonly number[],
    fb: readonly number[],
  ): number[] =>
    fa.map(
      (v: number, i: number): number =>
        ((b - a) / 6) * (v + 4 * fm[i]! + fb[i]!),
    );
  const panel: (
    a: number,
    b: number,
    fa: readonly number[],
    fm: readonly number[],
    fb: readonly number[],
    coarse: readonly number[],
  ) => IPanel = (
    a: number,
    b: number,
    fa: readonly number[],
    fm: readonly number[],
    fb: readonly number[],
    coarse: readonly number[],
  ): IPanel => {
    const m: number = a + (b - a) / 2;
    const l: number = a + (m - a) / 2;
    const r: number = m + (b - m) / 2;
    if (!(a < l && l < m && m < r && r < b))
      throw new Error(
        `AirborneTakeoffQuadrature cannot resolve ${a} to ${b} s`,
      );
    const fl: readonly number[] = read(l);
    const fr: readonly number[] = read(r);
    const left: number[] = simpson(a, m, fa, fl, fm);
    const right: number[] = simpson(m, b, fm, fr, fb);
    const delta: number[] = left.map(
      (v: number, i: number): number => (v + right[i]! - coarse[i]!) / 15,
    );
    const value: number[] = left.map(
      (v: number, i: number): number => v + right[i]! + delta[i]!,
    );

    return {
      a,
      b,
      fa,
      fm,
      fb,
      fl,
      fr,
      left,
      right,
      value,
      // A component whose estimated error leaves the whole integral's
      // magnitude unchanged in floating point is resolved: no refinement
      // can move the computed sum (Gander and Gautschi's termination test,
      // is + (i2 - i1) == is).
      error: delta.map((v: number, i: number): number =>
        scale[i]! + Math.abs(v) === scale[i]! ? 0 : Math.abs(v),
      ),
    };
  };
  const fa: readonly number[] = read(props.t0);
  const fm: readonly number[] = read(props.t0 + (props.t1 - props.t0) / 2);
  const fb: readonly number[] = read(props.t1);
  // Each component's magnitude the roundoff test reads: the coarse Simpson
  // integral of its absolute value over the whole interval.
  const scale: readonly number[] = simpson(
    props.t0,
    props.t1,
    fa.map(Math.abs),
    fm.map(Math.abs),
    fb.map(Math.abs),
  );
  const leaves: IPanel[] = [
    panel(
      props.t0,
      props.t1,
      fa,
      fm,
      fb,
      simpson(props.t0, props.t1, fa, fm, fb),
    ),
  ];
  if (props.separable !== undefined) {
    const tree: AirborneQuadratureAggregate.ITree<IPanel> =
      AirborneQuadratureAggregate(leaves[0]!, props.separable.components);
    for (;;) {
      const { value, roundoff }: AirborneQuadratureAggregate.IRead =
        tree.read();
      const weights: readonly number[] = props.separable.weights(value);
      const rounding: number = props.error(value, roundoff);
      if (!(rounding >= 0))
        throw new Error(
          "AirborneTakeoffQuadrature received an invalid panel error",
        );
      if (tree.estimate(weights, rounding) <= props.tolerance)
        return [...value];
      const selected: IPanel = tree.worst(weights);
      // No leaf left with an error the budget weighs: every one is resolved,
      // and the rest is the arithmetic's own roundoff.
      if (
        props.separable
          .components(selected.error)
          .every((c: number, i: number): boolean => c * weights[i]! === 0)
      )
        return [...value];
      const middle: number = selected.a + (selected.b - selected.a) / 2;
      tree.replace(
        selected,
        panel(
          selected.a,
          middle,
          selected.fa,
          selected.fl,
          selected.fm,
          selected.left,
        ),
        panel(
          middle,
          selected.b,
          selected.fm,
          selected.fr,
          selected.fb,
          selected.right,
        ),
      );
    }
  }
  for (;;) {
    const value: number[] = Array.from(
      { length: dimensions! },
      (): number => 0,
    );
    for (const leaf of leaves)
      for (let i: number = 0; i < value.length; i++)
        value[i]! += leaf.value[i]!;
    let estimate: number = 0;
    let worst: number = 0;
    let largest: number = -1;
    for (let i: number = 0; i < leaves.length; i++) {
      const score: number = props.error(value, leaves[i]!.error);
      if (!(score >= 0))
        throw new Error(
          "AirborneTakeoffQuadrature received an invalid panel error",
        );
      estimate += score;
      if (score > largest) {
        largest = score;
        worst = i;
      }
    }
    if (estimate <= props.tolerance) return value;
    const leaf: IPanel = leaves[worst]!;
    const m: number = leaf.a + (leaf.b - leaf.a) / 2;
    leaves.splice(
      worst,
      1,
      panel(leaf.a, m, leaf.fa, leaf.fl, leaf.fm, leaf.left),
      panel(m, leaf.b, leaf.fm, leaf.fr, leaf.fb, leaf.right),
    );
  }
}
