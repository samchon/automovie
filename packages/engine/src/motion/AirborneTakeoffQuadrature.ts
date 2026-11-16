/**
 * Adaptive Simpson integration of a shooting seed's vector integrand.
 *
 * A panel compares one Simpson rule with two half-panel rules. Their
 * difference divided by 15 estimates the refined rule's error, and the
 * same Richardson correction forms its value (Gander and Gautschi,
 * Adaptive Quadrature--Revisited, BIT 40 (2000), 84--101,
 * https://www.cs.purdue.edu/homes/wxg/selected_works/section_07/160.pdf).
 * The caller measures each panel's componentwise absolute estimates in
 * its output's unit. Those measured errors are summed, and the panel with
 * the largest error is split until the global estimate meets the budget.
 *
 * @param props The finite interval, pure integrand, output-error measure and budget.
 * @returns The Richardson-corrected integral vector.
 * @throws {Error} When data are non-finite, dimensions change, the budget is invalid, or a required panel cannot be bisected at machine resolution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the nested Simpson rules, Richardson estimate, global criterion, failure and output-unit ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Uses adaptive Simpson with its fourth-order Richardson factor 15 and sums the caller's panel error norms by the triangle inequality. The estimator assumes locally smooth data and can miss unsampled structure; it does not certify arbitrary histories or the final physical flight.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read a five-node initial panel, sum its live leaves, test global error, then replace the worst leaf by its two children.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No frame grid, tolerance floor, guessed history or iteration cap replaces evaluation; unresolved error at machine resolution throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms P live leaves require 4P+1 integrand calls, sharing parent samples. For n components the straightforward leaf aggregation and largest-error scan cost O(P squared times n) over refinement; expensive history calls grow linearly with P rather than a prescribed time grid.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each child's endpoints and midpoint are the parent's actual samples, and its coarse Simpson value is the parent's computed half-panel value; no time quantization or cross-history memo is used.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only O(Pn) numeric leaf samples and estimates live during integration. They and the pure callback are released on return or throw; only the numeric result escapes, with no handle or global cache.
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

  /** Pure nonnegative norm-like measure of one panel's absolute component errors, using the current whole integral. Infinity requests refinement; NaN and negative errors are invalid. */
  error: (value: readonly number[], error: readonly number[]) => number;
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
      Number.isFinite(props.t0) &&
      Number.isFinite(props.t1) &&
      Number.isFinite(props.t1 - props.t0) &&
      props.t1 > props.t0
    )
  )
    throw new Error(
      "AirborneTakeoffQuadrature needs a finite forward interval",
    );
  if (!(Number.isFinite(props.tolerance) && props.tolerance >= 0))
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
    for (const component of value)
      if (!Number.isFinite(component))
        throw new Error(
          `AirborneTakeoffQuadrature needs finite components at ${t} s`,
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
    if (!value.every(Number.isFinite) || !delta.every(Number.isFinite))
      throw new Error(
        "AirborneTakeoffQuadrature produced a non-finite estimate",
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
      error: delta.map((v: number): number => Math.abs(v)),
    };
  };
  const fa: readonly number[] = read(props.t0);
  const fm: readonly number[] = read(props.t0 + (props.t1 - props.t0) / 2);
  const fb: readonly number[] = read(props.t1);
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
  for (;;) {
    const value: number[] = Array.from(
      { length: dimensions! },
      (): number => 0,
    );
    for (const leaf of leaves)
      for (let i: number = 0; i < value.length; i++)
        value[i]! += leaf.value[i]!;
    if (!value.every(Number.isFinite))
      throw new Error(
        "AirborneTakeoffQuadrature produced a non-finite integral",
      );
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
