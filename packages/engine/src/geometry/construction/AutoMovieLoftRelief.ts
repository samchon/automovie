import type { IAutoMovieLoftRelief } from "./IAutoMovieLoftRelief";

/**
 * Evaluation of a relief's height field over its window.
 *
 * The window maps to the knot range of a clamped-free uniform cubic
 * B-spline in each direction: with `n` control points the parameter runs
 * over `[0, n - 3]` and control point `i` shapes the spans `i - 3 .. i`.
 * The three outer rings of control points being zero, the height and its
 * first and second derivatives vanish at and beyond the window's edge.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the window, the falloff and the height's derivatives.
 * @evidence contracts/development/design.md#principled-representation Represents Evaluation of a relief's height field over its window: companion namespace of 4 members (`height`, `jet`, `field`, `width`); units and frames named in its text: radians, radian, local, second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieLoftRelief` in packages/engine/src/geometry/construction/AutoMovieLoftRelief.ts; its surface is the 4 members listed and the text shows 19 other files naming it, mostly packages/human (14), packages/engine (4), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieLoftRelief {
  /**
   * Height of the relief at a base station and phase, with its derivatives
   * along station and phase.
   *
   * @param relief Relief to evaluate.
   * @param s Base station, mm.
   * @param t Base phase, radians, any real value.
   * @returns `[d, dd/ds, dd/dt]` in mm, mm per mm and mm per radian; zero
   *   outside the window.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the local uniform cubic tensor-product basis and station/phase chain-rule factors; a shift delegates to the full mapped jet. Valid positive spans, dimensions and zero boundary control rings are producer premises.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The first-order reader avoids second derivatives for unshifted reliefs and shares jet's mapped semantics when a shift exists.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Outside-window height is exactly zero; no sample difference or shape-specific displacement replaces the authored field.
   * @evidence contracts/development/common.md#meaningful-documentation Names chart units, the three returned orders and window behavior; the namespace identifies the zero-control-ring falloff premise.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reads at most 16 controls for an unshifted field; shifted work is bounded by jet's two local field reads, independent of total net size.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One pair of basis/first-derivative arrays supplies height and both partials; the shift branch reuses its single full-jet result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates fixed-size basis/result arrays for the call and returns a fresh triple; the relief/net is not retained.
   */
  export function height(
    relief: IAutoMovieLoftRelief,
    s: number,
    t: number,
  ): [number, number, number] {
    if (relief.shift !== undefined) {
      const j: number[] = jet(relief, s, t);
      return [j[0]!, j[1]!, j[2]!];
    }
    const [s0, s1] = relief.stations;
    const span: number = width(relief);
    const offset: number = wrap(t - relief.phases[0]);
    if (s <= s0 || s >= s1 || offset >= span) return [0, 0, 0];
    const u: number = ((s - s0) / (s1 - s0)) * (relief.rows - 3);
    const v: number = (offset / span) * (relief.columns - 3);
    const [iu, wu, du] = basis(u, relief.rows);
    const [iv, wv, dv] = basis(v, relief.columns);
    let d: number = 0;
    let ds: number = 0;
    let dt: number = 0;
    for (let a: number = 0; a < 4; a++)
      for (let b: number = 0; b < 4; b++) {
        const h: number = relief.heights[(iu + a) * relief.columns + iv + b]!;
        d += wu[a]! * wv[b]! * h;
        ds += du[a]! * wv[b]! * h;
        dt += wu[a]! * dv[b]! * h;
      }
    return [
      d,
      (ds * (relief.rows - 3)) / (s1 - s0),
      (dt * (relief.columns - 3)) / span,
    ];
  }

  /**
   * Height with its first and second derivatives along station and phase,
   * the lips' station map applied.
   *
   * With the map `D`, the height is `d(s + D(s, t), t)`, so by the chain
   * rule, `sigma = s + D` and `d_1`, `d_2` the field's partials in its
   * station and phase:
   *
   * ```text
   * h_s  = d_1 (1 + D_s)
   * h_t  = d_1 D_t + d_2
   * h_ss = d_11 (1 + D_s)^2 + d_1 D_ss
   * h_st = d_11 (1 + D_s) D_t + d_12 (1 + D_s) + d_1 D_st
   * h_tt = d_11 D_t^2 + 2 d_12 D_t + d_22 + d_1 D_tt
   * ```
   *
   * @returns `[h, h_s, h_t, h_ss, h_st, h_tt]`; zero outside the window.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Applies the written first/second-order chain rule to d(s+D(s,t),t), with both fields evaluated from the same local cubic basis and admitted relief layout.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private field reader owns tensor-product partials while this function owns composition with the station map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Derivatives come from basis polynomials and chain rule; absence of shift means the identity map, without fitting or finite-difference compensation.
   * @evidence contracts/development/common.md#meaningful-documentation Gives all six return orders and the full station-map derivative equations, including mixed and second-phase terms.
   * @evidence contracts/development/implementation.md#efficient-algorithms Evaluates one height field and at most one shift field, each reading 16 controls, with constant work/storage independent of net dimensions.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each field visit accumulates every partial from its one support; the shift's six values serve all composition terms.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local basis and six-number field arrays die with the call; only the fresh six-number mapped jet escapes.
   */
  export function jet(
    relief: IAutoMovieLoftRelief,
    s: number,
    t: number,
  ): number[] {
    const D: number[] =
      relief.shift === undefined
        ? [0, 0, 0, 0, 0, 0]
        : field(relief, relief.shift, s, t);
    const d: number[] = field(relief, relief.heights, s + D[0]!, t);
    const a: number = 1 + D[1]!;
    return [
      d[0]!,
      d[1]! * a,
      d[1]! * D[2]! + d[2]!,
      d[3]! * a * a + d[1]! * D[3]!,
      d[3]! * a * D[2]! + d[4]! * a + d[1]! * D[4]!,
      d[3]! * D[2]! * D[2]! + 2 * d[4]! * D[2]! + d[5]! + d[1]! * D[5]!,
    ];
  }

  /**
   * A tensor-product net over the window with its partials up to second
   * order in station and phase, `[f, f_s, f_t, f_ss, f_st, f_tt]`, zero
   * outside the window.
   */
  function field(
    relief: IAutoMovieLoftRelief,
    net: readonly number[],
    s: number,
    t: number,
  ): number[] {
    const [s0, s1] = relief.stations;
    const span: number = width(relief);
    const offset: number = wrap(t - relief.phases[0]);
    if (s <= s0 || s >= s1 || offset >= span) return [0, 0, 0, 0, 0, 0];
    const su: number = (relief.rows - 3) / (s1 - s0);
    const sv: number = (relief.columns - 3) / span;
    const [iu, wu, du, eu] = second(
      ((s - s0) / (s1 - s0)) * (relief.rows - 3),
      relief.rows,
    );
    const [iv, wv, dv, ev] = second(
      (offset / span) * (relief.columns - 3),
      relief.columns,
    );
    const out: number[] = [0, 0, 0, 0, 0, 0];
    for (let a: number = 0; a < 4; a++)
      for (let b: number = 0; b < 4; b++) {
        const h: number = net[(iu + a) * relief.columns + iv + b]!;
        out[0]! += wu[a]! * wv[b]! * h;
        out[1]! += du[a]! * wv[b]! * h * su;
        out[2]! += wu[a]! * dv[b]! * h * sv;
        out[3]! += eu[a]! * wv[b]! * h * su * su;
        out[4]! += du[a]! * dv[b]! * h * su * sv;
        out[5]! += wu[a]! * ev[b]! * h * sv * sv;
      }
    return out;
  }

  /**
   * The world direction the relief's height moves a base point along at a
   * phase, with its first and second derivatives in phase.
   *
   * A fixed axis is its own direction with zero derivatives. With `turn`,
   * the direction is `e(t) = cos(t - c) axis + sin(t - c) turn` about the
   * window's middle phase `c`, so `e' = -sin(t - c) axis + cos(t - c) turn`
   * and `e'' = -e`. It does not depend on the station.
   *
   * @param relief Relief whose direction is read.
   * @param t Base phase, radians, any real value.
   * @returns `[e, e_t, e_tt]`, each a world vector.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The turning direction is a rotation in the plane of two fixed world vectors, so its phase derivatives are the rotation's own and its station derivatives vanish; a displaced point `p + h e` then differentiates by the product rule its callers apply.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reader serves the point, phase-tangent and second-order jet callers, with the fixed axis as the case of no turn.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No difference of sampled directions; a fixed axis returns exact zeros.
   * @evidence contracts/development/common.md#meaningful-documentation States the law, its centre and all three returned orders.
   * @evidence contracts/development/implementation.md#efficient-algorithms One sine and one cosine per call, or none for a fixed axis.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure direction reading coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh vectors and retains nothing.
   */
  export function direction(
    relief: IAutoMovieLoftRelief,
    t: number,
  ): [V3, V3, V3] {
    const a: V3 = relief.axis;
    if (relief.turn === undefined) return [a, [0, 0, 0], [0, 0, 0]];
    const b: V3 = relief.turn;
    const x: number = t - (relief.phases[0] + width(relief) / 2);
    const c: number = Math.cos(x);
    const s: number = Math.sin(x);
    const e: V3 = [c * a[0] + s * b[0], c * a[1] + s * b[1], c * a[2] + s * b[2]];
    return [
      e,
      [c * b[0] - s * a[0], c * b[1] - s * a[1], c * b[2] - s * a[2]],
      [-e[0], -e[1], -e[2]],
    ];
  }

  /**
   * Phase width of a finite window, radians, in `(0, 2 pi]`; equal endpoints mean one turn.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reduces the endpoint difference modulo a turn and interprets zero remainder as the full periodic window.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared width calculation keeps wrapping semantics identical in the first/second-order field readers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Equal or whole-turn-separated endpoints deliberately mean a full turn; nonfinite phase inputs are not independently admitted here.
   * @evidence contracts/development/common.md#meaningful-documentation States radians, positive finite-window range and the equal-endpoint interpretation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic reads two endpoints and allocates no collection.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This scalar width calculation coordinates no cross-call field preparation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a number without retaining the relief or any handle.
   */
  export function width(relief: IAutoMovieLoftRelief): number {
    const w: number = wrap(relief.phases[1] - relief.phases[0]);
    return w === 0 ? 2 * Math.PI : w;
  }
}

/** A world vector. */
type V3 = [number, number, number];

/** Phase reduced to `[0, 2 pi)`. */
function wrap(t: number): number {
  const r: number = t % (2 * Math.PI);
  return r < 0 ? r + 2 * Math.PI : r;
}

/** {@link basis} with the weights' second derivatives with respect to x. */
function second(
  x: number,
  count: number,
): [number, number[], number[], number[]] {
  const [i, w, d] = basis(x, count);
  const f: number = x - i;
  return [i, w, d, [1 - f, 3 * f - 2, 1 - 3 * f, f]];
}

/**
 * First control index of the span holding parameter x, the span's four
 * weights and their derivatives with respect to x.
 */
function basis(x: number, count: number): [number, number[], number[]] {
  const i: number = Math.min(count - 4, Math.max(0, Math.floor(x)));
  const f: number = x - i;
  return [
    i,
    [
      (1 - f) ** 3 / 6,
      (3 * f ** 3 - 6 * f ** 2 + 4) / 6,
      (-3 * f ** 3 + 3 * f ** 2 + 3 * f + 1) / 6,
      f ** 3 / 6,
    ],
    [
      -((1 - f) ** 2) / 2,
      (3 * f ** 2 - 4 * f) / 2,
      (-3 * f ** 2 + 2 * f + 1) / 2,
      f ** 2 / 2,
    ],
  ];
}
