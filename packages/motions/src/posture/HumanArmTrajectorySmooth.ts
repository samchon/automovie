import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/**
 * A context's quadratic terms and their curvature.
 *
 * @param c The context.
 * @returns The record, owned by the caller.
 */
export function HumanArmTrajectorySmooth(
  c: M.IContext,
  sampled: boolean = true,
): HumanArmTrajectorySmooth.ISmooth {
  const n: number = c.n;
  const vars: number = (c.open ? n - 1 : n - 2) * c.width;
  const band: number = 3 * c.width - 1;
  const p: Float64Array[] = Array.from(
    { length: vars },
    (): Float64Array => new Float64Array(band + 1),
  );
  const terms: HumanArmTrajectorySmooth.ITerm[] = [];
  const variable = (a: number, k: number, f: number): number =>
    (k - 1) * c.width + c.offset[a]! + f;
  c.free.forEach((free: number[], a: number): void => {
    // Accelerations; a still configuration's among its own waypoints.
    for (
      let k: number = c.still ? 2 : 0;
      sampled && k < (c.still ? n - 2 : n);
      ++k
    )
      free.forEach((d: number, f: number): void => {
        // An end's neighbour beyond it is the course beyond a stretch
        // (`M.IContext.beyond`), a constant, or the end itself.
        const before: readonly number[] | undefined =
          k === 0 ? c.beyond?.before?.[a] : undefined;
        const after: readonly number[] | undefined =
          k === n - 1 ? c.beyond?.after?.[a] : undefined;
        const from: [number, number][] = [
          ...(after === undefined
            ? [[Math.min(n - 1, k + 1), 1] as [number, number]]
            : []),
          [k, -2],
          ...(before === undefined
            ? [[Math.max(0, k - 1), 1] as [number, number]]
            : []),
        ];
        const offset: number = (before?.[d] ?? 0) + (after?.[d] ?? 0);
        const index: number[] = [];
        const coef: number[] = [];
        for (const [j, w] of from) {
          if (!M.inner(c, j)) continue;
          const at: number = index.indexOf(variable(a, j, f));
          if (at >= 0) coef[at] = coef[at]! + w;
          else {
            index.push(variable(a, j, f));
            coef.push(w);
          }
        }
        if (index.length > 0)
          terms.push({
            weight: T.ACCELERATION,
            index,
            coef,
            arm: a,
            coordinate: d,
            from,
            offset,
          });
      });

    // A still configuration drawn to its anchor.
    const anchor: readonly number[] | undefined = c.anchor?.[a];
    if (anchor !== undefined)
      for (let k: number = 1; k + 1 < n; ++k)
        free.forEach((d: number, f: number): void => {
          terms.push({
            weight: T.ANCHOR,
            index: [variable(a, k, f)],
            coef: [1],
            arm: a,
            coordinate: d,
            from: [[k, 1]],
            offset: -anchor[d]!,
          });
        });
  });
  for (const term of terms)
    for (let i: number = 0; i < term.index.length; ++i)
      for (let j: number = 0; j < term.index.length; ++j)
        if (term.index[j]! >= term.index[i]!) {
          const row: Float64Array = p[term.index[i]!]!;
          const at: number = term.index[j]! - term.index[i]!;
          row[at] = row[at]! + 2 * term.weight * term.coef[i]! * term.coef[j]!;
        }
  return { vars, band, p, terms };
}

/**
 * The part of an arms' trajectory's objective that is quadratic in the
 * coordinates themselves (`HumanArmTrajectoryModel`): each free coordinate's
 * squared second difference over the waypoints, and a still configuration's
 * squared distance from its anchor. Its curvature depends on the waypoints'
 * count and the free coordinates alone, so it is built once for a context and
 * every convex model of that context starts from a copy of it; only its
 * gradient is read at an iterate.
 */
export namespace HumanArmTrajectorySmooth {
  /** One squared residual `weight * r^2` with `r` linear in the coordinates. */
  export interface ITerm {
    /** The term's weight. */
    weight: number;

    /** The variables the residual moves with, by index in the convex model. */
    index: number[];

    /** Each variable's coefficient in the residual. */
    coef: number[];

    /** The arm whose coordinates the residual's value is read from. */
    arm: number;

    /** The coordinate, among the arm's nine. */
    coordinate: number;

    /** The waypoints the value sums, each with its factor, in the order summed. */
    from: readonly (readonly [number, number])[];

    /**
     * A constant added to the value: the anchor's coordinate, negated; zero for
     * a second difference.
     */
    offset: number;
  }

  /** The quadratic terms of a context and their curvature. */
  export interface ISmooth {
    /** The convex model's variables. */
    vars: number;

    /** Its half-bandwidth. */
    band: number;

    /**
     * The terms' summed curvature, twice each weight times its coefficients'
     * outer product.
     */
    p: Float64Array[];

    /**
     * The terms, each arm's second differences by waypoint and coordinate, then
     * its anchor's.
     */
    terms: ITerm[];
  }

  /**
   * Add the terms' gradient at an iterate to a convex model's linear term: `2 w
   * c r` per term, with `r` its residual at the iterate.
   *
   * @param smooth The context's terms.
   * @param x Each arm's coordinates at each waypoint.
   * @param q The linear term, added to in place.
   */
  export function gradient(
    smooth: ISmooth,
    x: readonly (readonly (readonly number[])[])[],
    q: Float64Array,
  ): void {
    for (const term of smooth.terms) {
      let r: number = term.offset;
      for (const [k, w] of term.from)
        r += w * x[term.arm]![k]![term.coordinate]!;
      for (let i: number = 0; i < term.index.length; ++i)
        q[term.index[i]!] =
          q[term.index[i]!]! + 2 * term.weight * term.coef[i]! * r;
    }
  }
}
