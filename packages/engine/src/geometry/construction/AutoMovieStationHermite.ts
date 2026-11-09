import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/**
 * Interpolation of a chain's values between two principal layers from their
 * values and station derivatives.
 *
 * A layer that carries first derivatives only is joined by the cubic
 * Hermite rule; two layers that both carry second derivatives as well are
 * joined by the quintic Hermite rule
 *
 * ```text
 * f(u) = H0 f_a + H1 H f'_a + H2 H^2 f''_a + H3 H^2 f''_b + H4 H f'_b + H5 f_b
 * ```
 *
 * with `u = (s - s_a) / H` and the quintic basis H0 .. H5, which matches
 * value, slope and curvature at both layers. A natural cubic spline's
 * interval is a cubic, which the quintic rule reproduces exactly from the
 * spline's own derivatives, so expanding a feature chain with second
 * derivatives changes no interval of the spline; it only lets an interval
 * end on a neighbour's derivatives (a shared key, a cap's end key), which
 * the redesign plan's section 2 requires for C2 joins.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both bases and when each applies.
 * @evidence contracts/development/design.md#principled-representation Represents Interpolation of a chain's values between two principal layers from their values and station derivatives: companion namespace of 6 members (`IEnd`, `weights`, `combine`, `framed`, `frameEnd`, `unflat`); units and frames named in its text: second, degree, local, frame. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieStationHermite` in packages/engine/src/geometry/construction/AutoMovieStationHermite.ts; its surface is the 6 members listed and the text shows 16 other files naming it, mostly packages/engine (11), packages/human (3), test (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieStationHermite {
  /**
   * A layer's value, station slope and optional station curvature for one equally sized array.
   *
   * @evidence contracts/development/design.md#principled-representation Endpoint value/first jet and optional second jet determine the cubic or quintic station interpolant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One record serves section, lift and flattened plane arrays without per-field interpolators.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional curvature marks available data; equal widths and finite entries are caller premises, not guaranteed by this structure.
   * @evidence contracts/development/common.md#meaningful-documentation Names per-station derivative units and the absent-curvature meaning.
   */
  export interface IEnd {
    /** Values at the layer. */
    value: readonly number[];

    /** Station derivatives at the layer, per mm of station. */
    slope: readonly number[];

    /** Second station derivatives at the layer; absent for a cubic end. */
    curvature?: readonly number[];
  }

  /**
   * Weights of `[f_a, f'_a, f''_a, f''_b, f'_b, f_b]` for the value or a
   * station derivative at unit parameter u of an interval of width H.
   *
   * The slope and curvature weights already include their factors H and
   * H^2, and the derivative weights the chain rule's `1 / H^order`, so a
   * value is the plain weighted sum of the six arrays. The cubic rule puts
   * zero on both curvatures.
   *
   * @param u Unit parameter in `[0, 1]`.
   * @param H Interval width in station units.
   * @param order 0 for the value, 1 or 2 for the station derivative.
   * @param quintic Whether both layers carry curvatures.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the cubic/quintic Hermite basis and its first/second derivatives with H and 1/H chain-rule factors; H must be nonzero and numerically representable.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One six-entry order serves values, slopes and curvatures, with zero curvature weights for the cubic rule.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the requested order and basis directly without clamping u, H or derivative magnitudes; valid interval admission stays with the chain.
   * @evidence contracts/development/common.md#meaningful-documentation Specifies six-array order, interval units, supported derivative orders and pre-applied chain-rule scaling.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-degree formulas take constant time and fixed-size temporary/result arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Returns weights once for a station/order so the owning reader can share them across every coefficient of that interval.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns six returned numbers; intermediate cubic/quintic arrays are call-local and no interval cache is owned.
   */
  export function weights(
    u: number,
    H: number,
    order: 0 | 1 | 2,
    quintic: boolean,
  ): number[] {
    const scale: number = 1 / H ** order;
    if (!quintic) {
      const c: number[] =
        order === 0
          ? [
              2 * u ** 3 - 3 * u ** 2 + 1,
              u ** 3 - 2 * u ** 2 + u,
              -2 * u ** 3 + 3 * u ** 2,
              u ** 3 - u ** 2,
            ]
          : order === 1
            ? [
                6 * u ** 2 - 6 * u,
                3 * u ** 2 - 4 * u + 1,
                -6 * u ** 2 + 6 * u,
                3 * u ** 2 - 2 * u,
              ]
            : [12 * u - 6, 6 * u - 4, -12 * u + 6, 6 * u - 2];
      return [
        c[0]! * scale,
        c[1]! * H * scale,
        0,
        0,
        c[3]! * H * scale,
        c[2]! * scale,
      ];
    }
    const q: number[] =
      order === 0
        ? [
            1 - 10 * u ** 3 + 15 * u ** 4 - 6 * u ** 5,
            u - 6 * u ** 3 + 8 * u ** 4 - 3 * u ** 5,
            0.5 * u ** 2 - 1.5 * u ** 3 + 1.5 * u ** 4 - 0.5 * u ** 5,
            0.5 * u ** 3 - u ** 4 + 0.5 * u ** 5,
            -4 * u ** 3 + 7 * u ** 4 - 3 * u ** 5,
            10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5,
          ]
        : order === 1
          ? [
              -30 * u ** 2 + 60 * u ** 3 - 30 * u ** 4,
              1 - 18 * u ** 2 + 32 * u ** 3 - 15 * u ** 4,
              u - 4.5 * u ** 2 + 6 * u ** 3 - 2.5 * u ** 4,
              1.5 * u ** 2 - 4 * u ** 3 + 2.5 * u ** 4,
              -12 * u ** 2 + 28 * u ** 3 - 15 * u ** 4,
              30 * u ** 2 - 60 * u ** 3 + 30 * u ** 4,
            ]
          : [
              -60 * u + 180 * u ** 2 - 120 * u ** 3,
              -36 * u + 96 * u ** 2 - 60 * u ** 3,
              1 - 9 * u + 18 * u ** 2 - 10 * u ** 3,
              3 * u - 12 * u ** 2 + 10 * u ** 3,
              -24 * u + 84 * u ** 2 - 60 * u ** 3,
              60 * u - 180 * u ** 2 + 120 * u ** 3,
            ];
    return [
      q[0]! * scale,
      q[1]! * H * scale,
      q[2]! * H * H * scale,
      q[3]! * H * H * scale,
      q[4]! * H * scale,
      q[5]! * scale,
    ];
  }

  /**
   * Interpolated array between two layer ends at the given weights.
   *
   * @param a Lower layer's end.
   * @param b Upper layer's end.
   * @param w Weights from {@link weights}.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Applies the six Hermite weights componentwise to endpoint values/jets, treating each absent curvature as zero as required by the cubic encoding.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One array map keeps the summation order identical for section, plane and lift consumers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not fit or normalize values; equal endpoint widths and six compatible weights are caller premises, and missing non-curvature entries are not repaired.
   * @evidence contracts/development/common.md#meaningful-documentation Identifies lower/upper endpoints and the weights producer; IEnd documents optional curvature.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(W) work and output for W components, with constant arithmetic per component.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every output component uses the supplied common weights instead of recomputing basis polynomials.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh W-entry array; no endpoint or weight reference is retained by the module.
   */
  export function combine(a: IEnd, b: IEnd, w: readonly number[]): number[] {
    return a.value.map(
      (v: number, k: number): number =>
        w[0]! * v +
        w[1]! * a.slope[k]! +
        (a.curvature === undefined ? 0 : w[2]! * a.curvature[k]!) +
        (b.curvature === undefined ? 0 : w[3]! * b.curvature[k]!) +
        w[4]! * b.slope[k]! +
        w[5]! * b.value[k]!,
    );
  }

  /**
   * Whether a layer has both a frame and first frame derivatives; second derivatives remain optional.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Checks field presence to select componentwise plane interpolation in the chain reader.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One two-field predicate separates interpolation-mode selection from arithmetic.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Presence does not validate orthonormality, numeric values or frame curvatures and does not certify a full surface jet.
   * @evidence contracts/development/common.md#meaningful-documentation States exactly which two fields are required and which derivative order stays optional.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two property-presence comparisons use constant time with no allocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This predicate coordinates no shared interval preparation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returning a boolean retains no layer or resource.
   */
  export function framed(layer: IAutoMovieLoftChain.ILayer): boolean {
    return layer.frame !== undefined && layer.frameSlopes !== undefined;
  }

  /**
   * A layer's plane as one array `[origin, u, v]` of nine numbers, with its
   * slopes and curvatures, for interpolation component by component.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Flattens the layer's frame and first/optional second derivative records into identically ordered nine-component endpoint arrays.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One adapter connects frame-shaped storage to the common Hermite array representation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Requires frame and frameSlopes from the caller; an absent frame curvature remains absent, without fabricated axes or derivative estimates.
   * @evidence contracts/development/common.md#meaningful-documentation Gives the origin/u/v order and optional curvature relationship used by interval selection.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copies two or three nine-entry arrays in constant work and space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned endpoint can serve multiple station derivative orders with their shared interval weights; this adapter owns no cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The new endpoint owns its flattened arrays without retaining the original layer or its tuples.
   */
  export function frameEnd(layer: IAutoMovieLoftChain.ILayer): IEnd {
    const flat = (f: AutoMovieLoftFrame.IFrame): number[] => [
      ...f.origin,
      ...f.u,
      ...f.v,
    ];
    return {
      value: flat(layer.frame!),
      slope: flat(layer.frameSlopes!),
      ...(layer.frameCurvatures === undefined
        ? {}
        : { curvature: flat(layer.frameCurvatures) }),
    };
  }

  /**
   * Plane of nine `[origin, u, v]` numbers; interpolated axes are preserved without renormalization.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Regroups interpolated components into the same affine basis and derivative record layout used by the chain.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three literal triples expose the fixed flattening convention.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not claim component interpolation preserves orthonormality or modify its axes; nine valid entries are a caller premise.
   * @evidence contracts/development/common.md#meaningful-documentation States layout and the absence of renormalization, which matters to analytic station derivatives.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant nine-component copying and fixed output storage.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This one record conversion owns no coordinated or cached work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns three fresh tuples; no reference to the input component array survives.
   */
  export function unflat(x: readonly number[]): AutoMovieLoftFrame.IFrame {
    return {
      origin: [x[0]!, x[1]!, x[2]!],
      u: [x[3]!, x[4]!, x[5]!],
      v: [x[6]!, x[7]!, x[8]!],
    };
  }
}
