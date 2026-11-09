import type { AutoMovieSolidRibbon } from "./AutoMovieSolidRibbon";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

type Vec3 = AutoMovieSolidVector.Vec3;
type IRibbon = AutoMovieSolidRibbon.IRibbon;
const { combine } = AutoMovieSolidVector;

/**
 * One column of the blend surface between two rails: the quintic Hermite span
 * in the blend's cross parameter `w` from the start ribbon (`w = 0`) to the end
 * ribbon (`w = 1`).
 *
 * The quintic Hermite basis interpolates a point and its first and second
 * derivatives at both ends, so the column leaves the start surface with the
 * start ribbon's jet and arrives on the end surface with the end ribbon's,
 * which with smooth, regular and compatible ribbon fields makes the blend
 * G2 to both surfaces
 * (`AutoMovieSolidRibbon`; Hartmann 2001, parametric G^n blending; the
 * Coons-type strip of `docs/techniques/surface-composition.md`). The start
 * ribbon's `first` points from its rail into the blend; the end ribbon's
 * `first` is the derivative at `w = 1` in increasing `w`, from the blend into
 * the end surface. Their lengths are the blend's laws: each ribbon's scale is
 * set by its caller, as the chord between the rails over the cross
 * derivative's length. This sets the endpoint derivative lengths to that
 * chord; the Hermite span does not bound its interior speed or bulge.
 *
 * @evidence contracts/common.md#principled-implementation Quintic Hermite interpolation matches both supplied 2-jets; G2 surface contact additionally requires regular compatible ribbon fields along the rails, not just one column.
 * @evidence contracts/common.md#clear-and-simple-design One jet function of the two ribbons and the share across.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The ribbons' lengths are the caller's laws; the column does not rescale them to hide a fold.
 * @evidence contracts/common.md#meaningful-documentation States the basis, the ribbons' roles and their scaling.
 * @evidence contracts/performance.md#efficient-algorithms Constant work from three rows of six weights and three six-vector sums; this evaluator does not search for or reject a folded column.
 * @evidence contracts/performance.md#reuse-equivalent-work One basis call shares powers of the same parameter across the value and two derivative rows; separate jet requests are recomputed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns three vectors and retains nothing.
 */
export namespace AutoMovieSolidBlend {
  /**
   * A column's point and its first and second derivatives in dimensionless `w`.
   *
   * @evidence contracts/common.md#principled-implementation Three world vectors carry a Hermite column's value and parameter derivatives, independently of its rail's own parameter speed.
   * @evidence contracts/common.md#clear-and-simple-design One named field per derivative order exposes the same column to direct blend readers and Join's fold checks.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This record does not certify regularity, G2 contact or the absence of self-intersection.
   * @evidence contracts/common.md#meaningful-documentation Identifies world millimetres and derivatives per unit w, with no physical-span rescaling.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A result shape chooses no algorithm; jet owns the fixed arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates no requests or computation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources jet creates three result vectors owned by its caller; this type creates no cache or handle.
   */
  export interface IJet {
    /** Point, mm. */
    point: Vec3;

    /** First derivative, mm per unit `w`. */
    first: Vec3;

    /** Second derivative, mm per unit `w` squared. */
    second: Vec3;
  }

  /**
   * The column at a share of the cross parameter.
   *
   * @param start The start rail's ribbon, `first` into the blend.
   * @param end The end rail's ribbon, `first` along increasing `w` into the end surface.
   * @param w Share of the column, 0 the start rail and 1 the end rail; a share
   *   outside reads the quintic past its ends.
   * @returns The point and its `w` derivatives.
   *
   * @evidence contracts/common.md#principled-implementation Applies the quintic Hermite value, first and second derivative weights to both ribbons' supplied 2-jets; finite representable inputs are required for finite output.
   * @evidence contracts/common.md#clear-and-simple-design One local weighted-sum reader produces the three derivative orders from the same six source vectors.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither clamps w nor rescales the caller's ribbons; extrapolated, nonfinite or folded results remain observable.
   * @evidence contracts/common.md#meaningful-documentation Gives endpoint signs, extrapolation and dimensionless cross-parameter derivative units.
   * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic: one three-by-six basis and three sums of six three-component vectors, without a search or iteration.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads one basis for the same w across all coordinate sums; independent calls, including Join's separate fold reads, repeat this work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates call-local weights and sums, returning three fresh vectors without retaining either input ribbon.
   */
  export function jet(start: IRibbon, end: IRibbon, w: number): IJet {
    const h: number[][] = basis(w);
    const at = (k: number): Vec3 =>
      combine([
        [h[k]![0]!, start.point],
        [h[k]![1]!, start.first],
        [h[k]![2]!, start.second],
        [h[k]![3]!, end.second],
        [h[k]![4]!, end.first],
        [h[k]![5]!, end.point],
      ]);
    return { point: at(0), first: at(1), second: at(2) };
  }

  /**
   * The quintic Hermite basis and its first two derivatives at a share: the
   * weights of the start point, its first and second derivatives, the end's
   * second and first derivatives and the end point.
   *
   * @param t Share of the span.
   * @returns Three rows of six weights: values, first and second derivatives.
   *
   * @evidence contracts/common.md#principled-implementation The degree-five Hermite polynomials satisfy the two endpoint value/first/second interpolation conditions, ordered start value/first/second then end second/first/value.
   * @evidence contracts/common.md#clear-and-simple-design Three literal rows expose the polynomial and both analytic derivatives; no fitted coefficients or lookup table is involved.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Evaluates the requested t without clamping; binary64 cancellation or overflow is not replaced by an endpoint or fabricated finite result.
   * @evidence contracts/common.md#meaningful-documentation States row order and all six column meanings for unit-span parameter derivatives.
   * @evidence contracts/performance.md#efficient-algorithms Fixed-degree arithmetic constructs eighteen weights; cost and output size do not depend on a mesh or station count.
   * @evidence contracts/performance.md#reuse-equivalent-work Computes t squared through t to the fifth once and shares those powers among all three rows.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns three fresh six-number arrays and retains no parameter-keyed table.
   */
  export function basis(t: number): number[][] {
    const t2: number = t * t;
    const t3: number = t2 * t;
    const t4: number = t3 * t;
    const t5: number = t4 * t;
    return [
      [
        1 - 10 * t3 + 15 * t4 - 6 * t5,
        t - 6 * t3 + 8 * t4 - 3 * t5,
        0.5 * t2 - 1.5 * t3 + 1.5 * t4 - 0.5 * t5,
        0.5 * t3 - t4 + 0.5 * t5,
        -4 * t3 + 7 * t4 - 3 * t5,
        10 * t3 - 15 * t4 + 6 * t5,
      ],
      [
        -30 * t2 + 60 * t3 - 30 * t4,
        1 - 18 * t2 + 32 * t3 - 15 * t4,
        t - 4.5 * t2 + 6 * t3 - 2.5 * t4,
        1.5 * t2 - 4 * t3 + 2.5 * t4,
        -12 * t2 + 28 * t3 - 15 * t4,
        30 * t2 - 60 * t3 + 30 * t4,
      ],
      [
        -60 * t + 180 * t2 - 120 * t3,
        -36 * t + 96 * t2 - 60 * t3,
        1 - 9 * t + 18 * t2 - 10 * t3,
        3 * t - 12 * t2 + 10 * t3,
        -24 * t + 84 * t2 - 60 * t3,
        60 * t - 180 * t2 + 120 * t3,
      ],
    ];
  }
}
