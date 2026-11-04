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
 * which with smooth rails makes the blend G2 to both surfaces
 * (`AutoMovieSolidRibbon`; Hartmann 2001, parametric G^n blending; the
 * Coons-type strip of `docs/techniques/surface-composition.md`). The start
 * ribbon's `first` points from its rail into the blend; the end ribbon's
 * `first` is the derivative at `w = 1` in increasing `w`, from the blend into
 * the end surface. Their lengths are the blend's laws: each ribbon's scale is
 * set by its caller, as the chord between the rails over the cross
 * derivative's length, so the column runs at about unit chord speed and
 * bulges by neither end's own parameter speed.
 *
 * @evidence contracts/common.md#principled-implementation Each blend column is the quintic Hermite of the two ribbons' 2-jets, so it meets both surfaces G2.
 * @evidence contracts/common.md#clear-and-simple-design One jet function of the two ribbons and the share across.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The ribbons' lengths are the caller's laws; the column does not rescale them to hide a fold.
 * @evidence contracts/common.md#meaningful-documentation States the basis, the ribbons' roles and their scaling.
 * @evidence contracts/performance.md#efficient-algorithms Constant work per evaluation from the six basis weights.
 * @evidence contracts/performance.md#reuse-equivalent-work The basis is evaluated once per share and applied to all three derivative orders.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns three vectors and retains nothing.
 */
export namespace AutoMovieSolidBlend {
  /** A column's point and its first and second derivatives in `w`. */
  export interface IJet {
    /** Point, mm. */
    point: Vec3;

    /** First derivative in `w`. */
    first: Vec3;

    /** Second derivative in `w`. */
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
