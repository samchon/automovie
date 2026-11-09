import { AutoMovieHarmonicCurve } from "./AutoMovieHarmonicCurve";
import { AutoMovieLoftCapSource } from "./AutoMovieLoftCapSource";
import { AutoMovieLoftCoefficientSource } from "./AutoMovieLoftCoefficientSource";
import { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieLoftFrameSource } from "./AutoMovieLoftFrameSource";
import { AutoMovieLoftPoint } from "./AutoMovieLoftPoint";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import { AutoMovieStationHermite } from "./AutoMovieStationHermite";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/**
 * Read a chain from its immutable principal values and explicit interpolation/source data.
 *
 * Ordinary coefficients and lift retain cubic/quintic physical-station Hermite interpolation.
 * Capped coefficientSource rows instead interpolate in their declared common root/angle
 * coordinate and carry derivatives to station. Matching frameSource rows read their actual
 * analytic axis; ordinary/mixed boundaries retain the existing layer-plane interpolation.
 * Explicit native sources own actual polar geometry; compatibility coefficients remain
 * independently readable. Polar phase meaning and principal-layer domain are unchanged.
 * Full cap-span ownership and apex G2 are not certified by this regular chart.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States interpolation modes, mm/radian units, immutable callable sources and unverified pole/phase fidelity.
 * @evidence contracts/development/design.md#principled-representation Represents Read a chain from its immutable principal values and explicit interpolation/source data: companion namespace of 18 members (`coefficients`, `derivative`, `bracket`, `lift`, `Pick`, `sectionArrays`, ...); units and frames named in its text: second, frame, world, radians, radian. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieLoftChain` in packages/engine/src/geometry/construction/AutoMovieLoftChain.ts; its surface is the 18 members listed and the text shows 96 other files naming it, mostly packages/human (61), test (26), packages/engine (9), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieLoftChain {
  /**
   * Section coefficients at height y by the Hermite rule above.
   *
   * Heights outside the chain are refused rather than extrapolated, because
   * a chain's polynomial carries no shape evidence beyond its end layers.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the declared coefficient interpolant in the existing regular layer domain.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Combines endpoint arrays once; explicit capped data selects parameter weights.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves ordinary Hermite arithmetic and rejects out-of-domain stations; source curves are not claimed reproduced universally.
   * @evidence contracts/development/common.md#meaningful-documentation Returns basis-layout values in mm.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N) output plus binary bracketing and fixed parameter weights.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses stored endpoint parameter/station derivatives.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh row and retains no query.
   */
  export function coefficients(
    chain: IAutoMovieLoftChain,
    y: number,
  ): number[] {
    return hermite(chain, y, false);
  }

  /**
   * Station derivative of the section coefficients at s, mm per mm.
   *
   * The derivative of the same Hermite rule; a region calibration that trims
   * a chain uses it to give the new end layer the slope of the original
   * function, so trimming changes no shape.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Differentiates the same coefficient interpolant by the declared physical chain rule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Uses the same span/value owner as coefficients.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not replace a pole derivative by a finite value or change the existing regular-domain bound.
   * @evidence contracts/development/common.md#meaningful-documentation Returns first coefficient derivatives per mm.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N) output plus binary bracketing.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses prepared endpoint derivatives and shared span weights.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh row without retained query state.
   */
  export function derivative(chain: IAutoMovieLoftChain, s: number): number[] {
    return hermite(chain, s, true);
  }

  /**
   * Indices `[lo, hi]` of the principal interval containing station s.
   *
   * Stations outside the chain are refused. The last interval also owns the
   * top layer itself.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Binary-searches strictly increasing principal stations in the existing owned layer interval.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One interval convention also owns the top layer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the original 1e-9 boundary allowance and outside-range failure; no new pole domain is inferred.
   * @evidence contracts/development/common.md#meaningful-documentation States sorted nonempty layer premises and last-interval ownership.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(log L) comparisons and constant output storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All station readers share this bracket convention.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns two indices and retains no layer.
   */
  export function bracket(
    chain: IAutoMovieLoftChain,
    s: number,
  ): [number, number] {
    const layers: readonly IAutoMovieLoftChain.ILayer[] = chain.layers;
    const bottom: number = layers[0]!.y;
    const top: number = layers[layers.length - 1]!.y;
    if (s < bottom - 1e-9 || s > top + 1e-9)
      throw new Error(`Station ${s} is outside chain ${chain.name}`);

    // Binary search over the sorted layer stations.
    let lo: number = 0;
    let hi: number = layers.length - 1;
    while (hi - lo > 1) {
      const mid: number = (lo + hi) >> 1;
      if (layers[mid]!.y <= s) lo = mid;
      else hi = mid;
    }
    return [lo, hi];
  }

  /**
   * Out-of-plane lift of every control point at station s, by the same
   * Hermite rule as the coefficients; null for a chain whose layers carry
   * none, which then lies in its section planes.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Interpolates actual lift data in physical station with the existing cubic/quintic rule and zero absent rows.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One nullable row separates no lift from a prepared lift.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not reparameterize lift by the capped coefficient map or invent a displacement.
   * @evidence contracts/development/common.md#meaningful-documentation Returns mm lift values, null only when no layer has lift.
   * @evidence contracts/development/implementation.md#efficient-algorithms One layer-presence scan and O(N) interpolation/output.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The sampler reuses a prepared lift across phases.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned lift rows belong to the caller; no module retention.
   */
  export function lift(chain: IAutoMovieLoftChain, s: number): number[] | null {
    if (
      !chain.layers.some(
        (l: IAutoMovieLoftChain.ILayer): boolean => l.lift !== undefined,
      )
    )
      return null;
    return hermite(chain, s, false, liftArrays);
  }

  /** Accessor of one Hermite-interpolated array of a layer: values and station slopes. */
  type Pick = (
    layer: IAutoMovieLoftChain.ILayer,
  ) => [readonly number[], readonly number[]];

  /** Values and slopes of a layer's section coefficients. */
  function sectionArrays(
    layer: IAutoMovieLoftChain.ILayer,
  ): [readonly number[], readonly number[]] {
    return [layer.coefficients, layer.slopes];
  }

  /** Values and slopes of a layer's lift, zero where the layer has none. */
  function liftArrays(
    layer: IAutoMovieLoftChain.ILayer,
  ): [readonly number[], readonly number[]] {
    if (layer.lift !== undefined) return [layer.lift, layer.liftSlopes!];
    const zero: number[] = new Array<number>(
      layer.coefficients.length / 2,
    ).fill(0);
    return [zero, zero];
  }

  /** Hermite coefficients (or their station derivative) at s. */
  function hermite(
    chain: IAutoMovieLoftChain,
    y: number,
    differentiate: boolean,
    pick: Pick = sectionArrays,
  ): number[] {
    const layers: readonly IAutoMovieLoftChain.ILayer[] = chain.layers;
    const [lo, hi]: [number, number] = bracket(chain, y);
    if (pick === sectionArrays) {
      const source: AutoMovieLoftCoefficientSource.IControls | null =
        AutoMovieLoftCoefficientSource.controls(chain, y);
      if (source !== null)
        return AutoMovieStationHermite.combine(
          source.a,
          source.b,
          AutoMovieLoftCoefficientSource.weights(source, differentiate ? 1 : 0),
        );
    }

    const [av, am]: [readonly number[], readonly number[]] = pick(layers[lo]!);
    const [bv, bm]: [readonly number[], readonly number[]] = pick(layers[hi]!);
    const a: IAutoMovieLoftChain.ILayer = layers[lo]!;
    const b: IAutoMovieLoftChain.ILayer = layers[hi]!;
    const H: number = b.y - a.y;
    const u: number = Math.min(1, Math.max(0, (y - a.y) / H));

    // Layers that carry second derivatives (a feature chain expanded with
    // its jets) take the quintic rule; the cubic below stays as it was.
    const ac: number[] | undefined =
      pick === sectionArrays ? a.curvatures : a.liftCurvatures;
    const bc: number[] | undefined =
      pick === sectionArrays ? b.curvatures : b.liftCurvatures;
    if (ac !== undefined && bc !== undefined)
      return AutoMovieStationHermite.combine(
        { value: av, slope: am, curvature: ac },
        { value: bv, slope: bm, curvature: bc },
        AutoMovieStationHermite.weights(u, H, differentiate ? 1 : 0, true),
      );

    // Cubic Hermite basis on the unit interval, or its derivative divided by
    // H, which converts d/du back to d/ds.
    const h00: number = differentiate
      ? (6 * u ** 2 - 6 * u) / H
      : 2 * u ** 3 - 3 * u ** 2 + 1;
    const h10: number = differentiate
      ? (3 * u ** 2 - 4 * u + 1) / H
      : u ** 3 - 2 * u ** 2 + u;
    const h01: number = differentiate
      ? (-6 * u ** 2 + 6 * u) / H
      : -2 * u ** 3 + 3 * u ** 2;
    const h11: number = differentiate
      ? (3 * u ** 2 - 2 * u) / H
      : u ** 3 - u ** 2;

    // Slopes are per mm of height; H converts them to the unit parameter.
    return av.map(
      (c: number, k: number): number =>
        h00 * c + h10 * H * am[k]! + h01 * bv[k]! + h11 * H * bm[k]!,
    );
  }

  /**
   * Frame of an unchanged actual-axis interval or its declared layer interpolation.
   * Different source owners at a continuation boundary use the copied endpoint jets.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Validated original caps and matching valid row-axis records read their actual axis; other boundaries retain the existing Hermite/rotation frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The frame owner holds source selection and every fallback together.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Stale/stripped source records throw; numerical fallback is not called an exact RMF jet.
   * @evidence contracts/development/common.md#meaningful-documentation States original retained cap, regular-domain and copied-continuation boundary behavior; coefficient means/controls remain principal-domain statistics.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cap ownership validates O(K+N) source/row snapshots; ordinary queries use binary bracketing and constant frame work or the actual axis query.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the immutable prepared actual axis when declared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a caller-owned frame without a query cache here.
   */
  export function frame(
    chain: IAutoMovieLoftChain,
    s: number,
  ): AutoMovieLoftFrame.IFrame {
    const cap: AutoMovieLoftCapSource.ISource | null =
      AutoMovieLoftCapSource.at(chain, s);
    if (cap !== null) return cap.axis.at(s);
    const [lo, hi]: [number, number] = bracket(chain, s);
    return AutoMovieLoftFrameSource.frame(chain, s, lo, hi);
  }

  /**
   * Central-axis point `[x, y, z]` in mm at station s: the section centroid.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Places the basis coefficient mean in the same frame and adds mean lift along v-cross-u.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Centroid, source frame and lift use the same station definition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the existing coefficient mean and unnormalized frame-normal convention.
   * @evidence contracts/development/common.md#meaningful-documentation Returns the central-axis point in world mm.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N) coefficient/mean/lift work plus frame evaluation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same coefficient and lift readers as surface points.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh world triple and retains nothing.
   */
  export function axis(
    chain: IAutoMovieLoftChain,
    s: number,
  ): [number, number, number] {
    const [x, z]: [number, number] = center(chain, coefficients(chain, s));
    const f: AutoMovieLoftFrame.IFrame = frame(chain, s);
    const p: [number, number, number] = AutoMovieLoftFrame.place(f, x, z);

    // The mean lift over uniform phase is the control-value mean, as for
    // the in-plane centroid.
    const l: number[] | null = lift(chain, s);
    if (l === null) return p;
    const h: number =
      l.reduce((sum: number, v: number): number => sum + v, 0) / l.length;
    const n: [number, number, number] = normal(f);
    return [p[0] + h * n[0], p[1] + h * n[1], p[2] + h * n[2]];
  }

  /**
   * Evaluate a section of the chain's basis and its phase derivative.
   *
   * @param chain Chain whose basis and order the coefficients follow.
   * @param coefficients Section coefficients, as from {@link coefficients}.
   * @param t Phase in radians.
   * @returns `[x, z, dx/dt, dz/dt]` in the section plane, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the unchanged harmonic or periodic cubic phase basis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One discriminant chooses the existing basis owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changes no phase representation, control layout or normalization.
   * @evidence contracts/development/common.md#meaningful-documentation Returns in-plane value and first phase derivative in mm/radian units.
   * @evidence contracts/development/implementation.md#efficient-algorithms Existing basis cost follows order; cubic spline support is local.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Consumes supplied prepared coefficients without another station interpolation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh fixed tuple without retained coefficients.
   */
  export function section(
    chain: IAutoMovieLoftChain,
    coefficients: readonly number[],
    t: number,
  ): [number, number, number, number] {
    return chain.basis === "spline"
      ? AutoMovieSplineCurve.evaluate(coefficients, chain.order, t)
      : AutoMovieHarmonicCurve.evaluate(coefficients, chain.order, t);
  }

  /**
   * Mean `[x, z]` of a section over phase, a point of the central axis.
   *
   * The constant terms of a harmonic section; the control-point mean of a
   * spline section.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads harmonic constants or the exact control mean of a periodic spline.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One basis branch owns the centroid convention.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not fit a centre to emitted points or triangles.
   * @evidence contracts/development/common.md#meaningful-documentation Returns local x/z mean in mm.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N) spline summation or constant harmonic reads.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Consumes the already prepared coefficient row.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns two numbers and keeps no source.
   */
  export function center(
    chain: IAutoMovieLoftChain,
    coefficients: readonly number[],
  ): [number, number] {
    if (chain.basis !== "spline")
      return [
        coefficients[0]!,
        coefficients[AutoMovieHarmonicCurve.width(chain.order)]!,
      ];
    const n: number = chain.order;
    let x: number = 0;
    let z: number = 0;
    for (let i: number = 0; i < n; i++) {
      x += coefficients[i]!;
      z += coefficients[n + i]!;
    }
    return [x / n, z / n];
  }

  /**
   * Planar section coordinates of world points in the frame at station s.
   *
   * Used to give inherited ring vertices phases by the chain's own rule.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates world-to-plane coordinate reading to the existing frame convention at the same station.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame preparation is shared across the point list.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not renormalize a fitted frame or silently repair its metric.
   * @evidence contracts/development/common.md#meaningful-documentation Inputs and returned coordinates use world/local mm; admitted-frame premises remain with its producer.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(P) point work plus one station frame query.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses one frame for every supplied point.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh local pairs and retains no point list.
   */
  export function local(
    chain: IAutoMovieLoftChain,
    s: number,
    points: readonly (readonly [number, number, number])[],
  ): [number, number][] {
    const f: AutoMovieLoftFrame.IFrame = frame(chain, s);
    return points.map(
      (p: readonly [number, number, number]): [number, number] =>
        AutoMovieLoftFrame.local(f, p),
    );
  }

  /**
   * Ring of world points `[x, y, z]` at station s and the given phases.
   *
   * @param chain Chain to evaluate.
   * @param s Station within the chain; world height for horizontal layers.
   * @param phases Correspondence phases in radians.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same value sampler for every requested phase.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One station preparation feeds the ring map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changes neither phase correspondence nor the point definition.
   * @evidence contracts/development/common.md#meaningful-documentation Stations use mm and phases radians; returns world-mm points.
   * @evidence contracts/development/implementation.md#efficient-algorithms One sampler preparation plus local phase support per point.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses coefficients, source frame and lift across all phases.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh ring vectors; sampler lifetime ends with the call.
   */
  export function ring(
    chain: IAutoMovieLoftChain,
    s: number,
    phases: readonly number[],
  ): [number, number, number][] {
    const point: (t: number) => [number, number, number] = sampler(chain, s);
    return phases.map((t: number): [number, number, number] => point(t));
  }

  /**
   * Prepare the existing value-only station sampler, including actual source metadata.
   *
   * @param chain Immutable chain whose retained sources remain unchanged.
   * @param s Owned station in the principal interval or an explicitly retained original cap, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the same value-only point definition to its point owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The public API stays in LoftChain while point preparation has one owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No alternative geometry or phase evaluator is introduced.
   * @evidence contracts/development/common.md#meaningful-documentation States immutable source and physical station units; retained cap Point0 does not imply physical2 at its collapsed tip.
   * @evidence contracts/development/implementation.md#efficient-algorithms The point owner prepares O(N) arrays once for repeated phase calls.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned closure reuses its one station preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Caller release ends the returned closure's retained station lifetime.
   */
  export function sampler(
    chain: IAutoMovieLoftChain,
    s: number,
  ): (t: number) => [number, number, number] {
    return AutoMovieLoftPoint.sampler(chain, s);
  }

  /**
   * Prepare actual value and phase tangent without station-jet admission.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates source/basis value and phase differentiation to the same point owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A thin adapter serves callers whose station derivative remains numerical.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Present source data never routes through compatibility coefficients or missing station jets.
   * @evidence contracts/development/common.md#meaningful-documentation Uses principal or explicitly retained cap stations in mm and phase radians; unavailable phase derivatives still fail and world outputs are fresh.
   * @evidence contracts/development/implementation.md#efficient-algorithms Costs follow the point owner's actual local field/frame/lift preparation and phase reading.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned closure reuses one station preparation across phases.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Caller release ends this closure's lifetime independently of Point/Jet module caches.
   */
  export function phaseSampler(
    chain: IAutoMovieLoftChain,
    s: number,
  ): (t: number) => {
    p: [number, number, number];
    t: [number, number, number];
  } {
    return AutoMovieLoftPoint.phaseSampler(chain, s);
  }

  /**
   * Read one point through the original bounded lazy sampler cache.
   *
   * @param chain Immutable chain/cache identity.
   * @param s Regular station, mm.
   * @param t Phase in radians.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates single-point evaluation to the original bounded lazy point owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The public chain API keeps its original signature.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves ordinary arithmetic, cache insertion/eviction and fresh vectors.
   * @evidence contracts/development/common.md#meaningful-documentation States immutable chain identity, mm station and radian phase.
   * @evidence contracts/development/implementation.md#efficient-algorithms New spline phase visits combine at most four new controls after O(N) storage preparation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the last eight inserted station samplers without hit promotion.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The point owner's weak-key eight-station cache bounds retention.
   */
  export function point(
    chain: IAutoMovieLoftChain,
    s: number,
    t: number,
  ): [number, number, number] {
    return AutoMovieLoftPoint.point(chain, s, t);
  }

  /** Unit normal `v x u` of a section frame: up for a horizontal frame. */
  function normal(f: AutoMovieLoftFrame.IFrame): [number, number, number] {
    return [
      f.v[1] * f.u[2] - f.v[2] * f.u[1],
      f.v[2] * f.u[0] - f.v[0] * f.u[2],
      f.v[0] * f.u[1] - f.v[1] * f.u[0],
    ];
  }
}
