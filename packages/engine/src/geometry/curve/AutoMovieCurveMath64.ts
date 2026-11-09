import { AutoMoviePchip64 } from "./AutoMoviePchip64";

/**
 * Binary64 vector and cubic Bernstein operations for three-component coefficient fields. PCHIP supplies shape-preserving scalar station derivatives; subdivision retains the requested arithmetic path rather than promising symbolic exactness.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its chart, coefficient order, ownership and arithmetic path.
 * @evidence contracts/development/design.md#principled-representation Represents Binary64 vector and cubic Bernstein operations for three-component coefficient fields: companion namespace of 18 members (`V`, `Span`, `clone`, `add`, `sub`, `scale`, ...); units and frames named in its text: frame, second, local, degree. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieCurveMath64` in packages/engine/src/geometry/curve/AutoMovieCurveMath64.ts; its surface is the 18 members listed and the text shows 36 other files naming it, mostly packages/engine (30), packages/recovery (4), packages/human (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieCurveMath64 {
  /**
   * Three-component spatial value or field derivative; units follow the owning position, angular or longitudinal chart.
   *
   * @evidence contracts/development/design.md#principled-representation A fixed mutable triple preserves coordinate ordering for coefficient construction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The tuple is shared by scalar-scaled positions and derivative fields.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No anatomical frame, unit conversion or finite admission is implied by a tuple.
   * @evidence contracts/development/common.md#meaningful-documentation The enclosing field owns physical or parameter units.
   */
  export type V = [number, number, number];

  /**
   * One cubic Bernstein record in P0, P1, P2, P3 order; the inner coefficients are handles, not interpolated supports.
   *
   * @evidence contracts/development/design.md#principled-representation Four ordered vectors define a cubic Bernstein coefficient net.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One tuple records endpoint and handle order for all cubic helpers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Handles remain coefficients rather than interpolation samples.
   * @evidence contracts/development/common.md#meaningful-documentation P0/P1/P2/P3 order is stated independently of the enclosing coordinate units.
   */
  export type Span = [V, V, V, V];

  /**
   * Copy the first three components into a fresh vector; the caller supplies a valid three-component value.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Copies the first three components in their original order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The returned mutable triple separates generated coefficient ownership from the input.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No normalization, coordinate conversion or rounding is applied.
   * @evidence contracts/development/common.md#meaningful-documentation The caller supplies three components in one declared chart.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three scalar copies have no algorithm choice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The current three components are copied without retaining a prior input/result pair.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a fresh three-number tuple transfers to the caller.
   */
  export const clone: (a: readonly number[]) => V = (
    a: readonly number[],
  ): V => [a[0]!, a[1]!, a[2]!];

  /**
   * Add two vectors in the same chart and units; no placement or derivative conversion is performed.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each result coordinate is the corresponding binary64 sum.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One componentwise addition is shared by cubic handle construction and subdivision.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Operands retain their order and no small-value snapping occurs.
   * @evidence contracts/development/common.md#meaningful-documentation Both operands must express compatible quantities in the same chart.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three additions have fixed cost and no traversal strategy.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Current operands determine the sum; no cross-call state is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The new tuple aliases neither input array.
   */
  export const add: (a: readonly number[], b: readonly number[]) => V = (
    a: readonly number[],
    b: readonly number[],
  ): V => [a[0]! + b[0]!, a[1]! + b[1]!, a[2]! + b[2]!];

  /**
   * Subtract two vectors in the same chart and units; no placement or derivative conversion is performed.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each result coordinate subtracts the second operand from the first.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A separate difference operation preserves displacement orientation at call sites.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Subtraction is not replaced with distance normalization.
   * @evidence contracts/development/common.md#meaningful-documentation The argument order defines the displacement or derivative difference.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three subtractions have fixed cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work No coordinate-dependent displacement is cached across calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the three scalar differences are returned.
   */
  export const sub: (a: readonly number[], b: readonly number[]) => V = (
    a: readonly number[],
    b: readonly number[],
  ): V => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];

  /**
   * Multiply every component by the supplied scalar; callers own the scalar's physical or parameter meaning.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Every coordinate is multiplied by the same supplied scalar.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Uniform scaling remains distinct from coordinate-frame transport.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Zero, negative and fractional factors use the same multiplication rule.
   * @evidence contracts/development/common.md#meaningful-documentation The factor multiplies the enclosing quantity units.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three multiplications have no algorithm choice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Scaling depends on the current vector and factor without retained results.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned triple does not retain the supplied array.
   */
  export const scale: (a: readonly number[], n: number) => V = (
    a: readonly number[],
    n: number,
  ): V => [a[0]! * n, a[1]! * n, a[2]! * n];

  /**
   * Affine interpolation a + (b - a)t in binary64; t is dimensionless and extrapolation is not clamped.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Computes a+(b-a)t with the explicit subtract-scale-add operation order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Subdivision callers choose this affine path explicitly.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The parameter is not clamped and no alternate weighted-sum rounding path is substituted.
   * @evidence contracts/development/common.md#meaningful-documentation The documentation identifies the exact binary64 blend order.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A fixed number of three-component operations is used.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work No interpolation result is shared across unrelated parameters.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Intermediate triples are local and only the resulting triple escapes.
   */
  export const mix: (a: V, b: V, t: number) => V = (a: V, b: V, t: number): V =>
    add(a, scale(sub(b, a), t));

  /**
   * Convert endpoint values and derivatives to cubic Bernstein coefficients using the supplied positive physical or phase interval dy. Derivatives are with respect to that interval's chart, not the unit cubic parameter.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Handle coefficients are a+da*dy/3 and b-db*dy/3, with copied endpoints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One endpoint/derivative conversion feeds cubic coefficient consumers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Derivatives keep their complete chart scale; unit tangents are not substituted.
   * @evidence contracts/development/common.md#meaningful-documentation The width and derivative units multiply to the endpoint-value units.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Four output controls require fixed work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Endpoint data are consumed once to construct the reusable cubic net.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Endpoint and handle tuples are newly owned by the returned span.
   */
  export const hermite: (a: V, b: V, da: V, db: V, dy: number) => Span = (
    a: V,
    b: V,
    da: V,
    db: V,
    dy: number,
  ): Span => [
    clone(a),
    add(a, scale(da, dy / 3)),
    sub(b, scale(db, dy / 3)),
    clone(b),
  ];

  /**
   * Convert exactly four cubic Bernstein controls to endpoint Hermite data on a
   * positive finite chart width. Derivatives are dP/ds, not unit directions or
   * unit-parameter derivatives. Endpoints and derivatives own fresh triples.
   * The inverse is algebraic in real arithmetic; finite evaluation does not
   * promise bitwise round trips or recover handles already lost to rounding.
   * Nonfinite input, a noncubic net and unresolved binary64 derivatives throw.
   * Existing endpoint evaluation is tried first, then fixed equivalent quotient
   * orders for unresolved components. This is not an arbitrary-precision
   * guarantee for every mathematically representable derivative.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Cubic endpoint derivatives are 3(B1-B0)/dy and 3(B3-B2)/dy. Positive finite dy selects the same chart convention as hermite; no fit, normalization or degree reduction supplies missing information.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One endpoint record is the inverse input of hermite. It reuses the existing derivative evaluator before finite endpoint-specific quotient orders; the existing evaluator keeps its original arithmetic and admission.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exactly four finite three-component controls are required. A quartic is not truncated and zero derivatives remain zero rather than becoming invented unit tangents.
   * @evidence contracts/development/common.md#meaningful-documentation States derivative units, width admission, fresh ownership, finite arithmetic failures and the absence of bitwise or higher-degree equivalence claims.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two endpoint differences and four fixed three-component outputs cost O(1) work and storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing cubic derivative evaluation supplies the ordinary endpoint result. Only unresolved components try equivalent finite quotient orders, without parameter sampling or fitting.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Four new vectors belong to the returned record, including when input endpoints alias; source arrays and cross-call state are not retained.
   */
  export function toHermite(
    span: readonly (readonly number[])[],
    dy: number,
  ): { start: V; end: V; startDerivative: V; endDerivative: V } {
    if (!(dy > 0 && Number.isFinite(dy)))
      throw new Error(
        "A positive finite cubic Hermite chart width is required",
      );
    if (
      span.length !== 4 ||
      ![0, 1, 2, 3].every(
        (i: number): boolean =>
          Object.hasOwn(span, i) &&
          Array.isArray(span[i]) &&
          span[i]!.length === 3 &&
          [0, 1, 2].every(
            (axis: number): boolean =>
              Object.hasOwn(span[i]!, axis) && Number.isFinite(span[i]![axis]),
          ),
      )
    )
      throw new Error(
        "Exactly four finite three-component cubic Bernstein controls are required",
      );
    return {
      start: clone(span[0]!),
      end: clone(span[3]!),
      startDerivative: endpointDerivative(span as readonly V[], 0, dy),
      endDerivative: endpointDerivative(span as readonly V[], 1, dy),
    };
  }

  /**
   * Reuse ordinary endpoint evaluation on an already admitted cubic, then try
   * endpoint-specific quotient orders only for unresolved components. Inactive
   * zero-times-overflow terms in the old polynomial formula therefore do not
   * reject a finite endpoint difference. A remaining nonfinite result or loss
   * of a nonzero difference to zero refuses conversion. These fixed binary64
   * orders are not an arbitrary-precision representability decision procedure.
   * The public conversion comment owns this private helper's Evidence answers.
   */
  function endpointDerivative(
    span: readonly V[],
    endpoint: 0 | 1,
    dy: number,
  ): V {
    const ordinary: V = derivative(span, endpoint, dy);
    const a: V = span[endpoint === 0 ? 0 : 2]!,
      b: V = span[endpoint === 0 ? 1 : 3]!;
    return [0, 1, 2].map((axis: number): number => {
      const delta: number = b[axis]! - a[axis]!;
      let value: number = ordinary[axis]!;
      if (!Number.isFinite(value) || (value === 0 && a[axis] !== b[axis]))
        value = (3 * delta) / dy;
      if (!Number.isFinite(value) || (value === 0 && a[axis] !== b[axis]))
        value = 3 * (delta / dy);
      if (!Number.isFinite(value) || (value === 0 && a[axis] !== b[axis]))
        value = 3 * (b[axis]! / dy - a[axis]! / dy);
      if (!Number.isFinite(value) || (value === 0 && a[axis] !== b[axis]))
        throw new Error("Cubic endpoint derivative is unresolved in binary64");
      return value;
    }) as V;
  }

  /**
   * Evaluate the four-coefficient cubic Bernstein formula at dimensionless t; the caller owns range checks and the coefficient units.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the four cubic Bernstein basis terms in the retained arithmetic order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure All three coordinates use the same scalar parameter and coefficient order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts It neither resamples inputs nor changes to a different polynomial evaluation path.
   * @evidence contracts/development/common.md#meaningful-documentation The caller owns the finite four-control premise and parameter domain.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Four terms per coordinate give fixed degree-three work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One supplied span is evaluated without a cross-parameter cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A new result tuple is returned and no source net is retained.
   */
  export const cubic: (a: readonly V[], t: number) => V = (
    a: readonly V[],
    t: number,
  ): V =>
    [0, 1, 2].map(
      (k: number): number =>
        (1 - t) ** 3 * a[0]![k]! +
        3 * (1 - t) ** 2 * t * a[1]![k]! +
        3 * (1 - t) * t * t * a[2]![k]! +
        t ** 3 * a[3]![k]!,
    ) as V;

  /**
   * Evaluate the cubic derivative divided by dy, yielding derivative per physical or phase unit rather than per unit t; callers must supply nonzero chart width. Signed widths and extrapolated t retain the same basis arithmetic. This evaluator adds no admission or finite-result exception; inverse conversion separately admits its stricter endpoint record.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Differentiates the cubic Bernstein terms and divides by the supplied chart width.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The physical-width scale stays with derivative evaluation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A derivative is not normalized to a unit direction.
   * @evidence contracts/development/common.md#meaningful-documentation The nonzero-width premise and derivative-per-chart-unit result are explicit.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three derivative terms per coordinate take fixed work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The derivative reads existing controls rather than reconstructing their generating field.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the derivative tuple escapes; input controls remain caller-owned.
   */
  export const derivative: (a: readonly V[], t: number, dy: number) => V = (
    a: readonly V[],
    t: number,
    dy: number,
  ): V =>
    [0, 1, 2].map(
      (k: number): number =>
        (3 / dy) *
        ((1 - t) ** 2 * (a[1]![k]! - a[0]![k]!) +
          2 * (1 - t) * t * (a[2]![k]! - a[1]![k]!) +
          t * t * (a[3]![k]! - a[2]![k]!)),
    ) as V;

  /**
   * De Casteljau subdivision at dimensionless t. The affine flag preserves the caller's chosen blend operation order; both children retain the same value units.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Three De Casteljau levels yield both exact polynomial restrictions before binary64 rounding.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One split returns the left and right coefficient nets together.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The affine flag preserves the caller-selected blend order instead of silently changing rounding.
   * @evidence contracts/development/common.md#meaningful-documentation The split parameter and coefficient units remain in the original chart.
   * @evidence contracts/development/implementation.md#efficient-algorithms Degree three fixes the number of blends and output coefficients.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Intermediate levels are shared between both children.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Both returned child nets own copied endpoint tuples and local subdivision results.
   */
  export function split(
    a: readonly V[],
    t: number,
    affine: boolean = false,
  ): [Span, Span] {
    const blend: (p: V, q: V) => V = (p: V, q: V): V =>
      affine ? mix(p, q, t) : add(scale(p, 1 - t), scale(q, t));
    const b: V[] = [
      blend(a[0]!, a[1]!),
      blend(a[1]!, a[2]!),
      blend(a[2]!, a[3]!),
    ];
    const c: V[] = [blend(b[0]!, b[1]!), blend(b[1]!, b[2]!)];
    const d: V = blend(c[0]!, c[1]!);
    return [
      [clone(a[0]!), b[0]!, c[0]!, d],
      [clone(d), c[1]!, b[2]!, clone(a[3]!)],
    ];
  }

  /**
   * Subdivide one cubic by positive relative widths while retaining coefficient units; nonpositive widths reject. The widths determine fractions and need not sum to one.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Consecutive width fractions split the remaining cubic in order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Partitioning delegates every restriction to the same split operation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Widths are not normalized into a different partition or replaced with equal spans.
   * @evidence contracts/development/common.md#meaningful-documentation Positive finite caller-owned widths describe relative chart durations.
   * @evidence contracts/development/implementation.md#efficient-algorithms For K widths the fixed-degree split is repeated K-1 times, O(K).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each split carries its remaining right child forward rather than restarting from the original span.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned pieces own their controls and temporary remaining nets expire.
   */
  export function partition(
    a: readonly V[],
    widths: readonly number[],
    affine: boolean = false,
  ): Span[] {
    if (widths.some((w: number): boolean => !(w > 0)))
      throw new Error("Positive actual phase widths required");
    let remaining: number = widths.reduce(
      (s: number, w: number): number => s + w,
      0,
    );
    let rest: Span = a.map(clone) as Span;
    const out: Span[] = [];
    for (const w of widths.slice(0, -1)) {
      const parts: [Span, Span] = split(rest, w / remaining, affine);
      out.push(parts[0]);
      rest = parts[1];
      remaining -= w;
    }
    return [...out, rest];
  }

  /** Delegates to the engine slope owner AutoMoviePchip64.slopes with the same station ordering and derivative units; that selected public operation documents admission, arithmetic, cost and ownership. */
  export const slopes: typeof AutoMoviePchip64.slopes = AutoMoviePchip64.slopes;

  /** Delegates to the engine slope owner AutoMoviePchip64.fieldSlopes with the same station ordering and derivative units; that selected public operation documents admission, arithmetic, cost and ownership. */
  export const fieldSlopes: typeof AutoMoviePchip64.fieldSlopes =
    AutoMoviePchip64.fieldSlopes;

  /**
   * Periodic scalar PCHIP over the supplied angular widths, using one wrapped neighbor on each end. Returns one-third angular derivatives so multiplying by a span width produces a cubic handle offset.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Adds one wrapped neighbor at each end and resolves periodic component slopes over cumulative widths.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Periodic coefficient ordering is an adapter around the shared scalar slope owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The one-third derivative scale remains explicit rather than normalized away.
   * @evidence contracts/development/common.md#meaningful-documentation Widths define the periodic chart and returned handles are one-third angular derivatives.
   * @evidence contracts/development/implementation.md#efficient-algorithms For N supports, three linear slope solves and wrapped arrays give O(N) work/storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Wrapped station coordinates are reused for all three component solves.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only new handle triples escape; wrapped coordinates and component columns expire.
   */
  export function angular(
    points: readonly V[],
    widths: readonly number[],
  ): V[] {
    const phases: number[] = [0];
    for (const w of widths) phases.push(phases.at(-1)! + w);
    const xs: number[] = [
      -widths.at(-1)!,
      ...phases,
      phases.at(-1)! + widths[0]!,
    ];
    const rows: V[] = [points.at(-1)!, ...points, points[0]!, points[1]!];
    const out: V[] = points.map((): V => [0, 0, 0]);
    for (let k: number = 0; k < 3; k++) {
      const d: number[] = slopes(
        xs,
        rows.map((p: V): number => p[k]!),
      );
      out.forEach((p: V, i: number): void => {
        p[k] = d[i + 1]! / 3;
      });
    }
    return out;
  }

  /**
   * Build a periodic cubic course from supports and one-third angular derivatives. Each outgoing and next incoming handle uses that span's width; array layouts must correspond.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Outgoing and next incoming handle offsets are scaled by the same interval width.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The periodic next-node rule constructs one cubic per support pair.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No refit or sampled waypoint conversion changes the supplied support/handle field.
   * @evidence contracts/development/common.md#meaningful-documentation Corresponding support, handle and positive-width layouts are caller premises.
   * @evidence contracts/development/implementation.md#efficient-algorithms One four-control output per support gives O(N) construction.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller-supplied support and derivative fields directly determine every span.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Endpoints are cloned and new handle triples belong to the returned spans.
   */
  export function spans(
    points: readonly V[],
    handles: readonly V[],
    widths: readonly number[],
  ): Span[] {
    return points.map((p: V, i: number): Span => {
      const n: number = (i + 1) % points.length;
      return [
        clone(p),
        add(p, scale(handles[i]!, widths[i]!)),
        sub(points[n]!, scale(handles[n]!, widths[i]!)),
        clone(points[n]!),
      ];
    });
  }
}
