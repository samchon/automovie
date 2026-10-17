import { AutoMovieBernsteinAlgebra64 as B } from "./AutoMovieBernsteinAlgebra64";

/**
 * Longitudinal Bernstein grids: four-row Hermite construction from endpoint courses and complete derivative courses, outer-parameter evaluation and outer-parameter differentiation.
 *
 * The inner (cross-course) coefficients of every row survive each operation, so a grid value or derivative is a complete polynomial course rather than sparse samples.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Cubic Hermite rows in the outer parameter built from elevated endpoint and derivative courses, evaluated and differentiated column by column.
 * @evidence contracts/common.md#clear-and-simple-design Grid construction and evaluation are separated from the polynomial algebra they compose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Complete derivative coefficients are retained; no finite-difference step or sampled tangent is introduced.
 * @evidence contracts/common.md#meaningful-documentation Each member states its chart-length and parameter contract.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Members state degree-dependent costs; a namespace declaration computes nothing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The namespace stores no cross-call result table.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No geometry, model, scene or lifetime handle is owned by the namespace.
 */
export namespace AutoMovieBernsteinGrid64 {
  /**
   * Build four longitudinal rows from endpoint curves and full derivatives over a physical chart length.
   *
   * @evidence contracts/common.md#principled-implementation All endpoint/derivative courses elevate to one degree and form four longitudinal Bernstein rows using length/3.
   * @evidence contracts/common.md#clear-and-simple-design The tensor constructor shares elevation and scaled polynomial addition.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Complete derivative coefficients are retained rather than unit tangent vectors.
   * @evidence contracts/common.md#meaningful-documentation Build four longitudinal rows from endpoint curves and full derivatives over a physical chart length.
   * @evidence contracts/performance.md#efficient-algorithms Degree elevation and four row constructions dominate cost.
   * @evidence contracts/performance.md#reuse-equivalent-work One maximum degree and elevated endpoint nets are reused for both inner rows.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The four-row grid owns its endpoint and handle coefficient arrays.
   */
  export function hermite(
    a: readonly B.Vec[],
    b: readonly B.Vec[],
    da: readonly B.Vec[],
    db: readonly B.Vec[],
    length: number,
  ): B.Grid {
    const degree: number =
        Math.max(a.length, b.length, da.length, db.length) - 1,
      aa: B.Poly = B.elevate(a, degree),
      bb: B.Poly = B.elevate(b, degree);
    return [
      aa,
      B.add(aa, B.elevate(da, degree), length / 3),
      B.add(bb, B.elevate(db, degree), -length / 3),
      bb,
    ];
  }
  /**
   * Evaluate the outer grid parameter while retaining the complete cross-course coefficients.
   *
   * @evidence contracts/common.md#principled-implementation Evaluates every cross-course coefficient column in the outer grid parameter.
   * @evidence contracts/common.md#clear-and-simple-design Grid evaluation delegates to the same vector De Casteljau owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The complete cross-course polynomial survives; no sparse samples replace its coefficients.
   * @evidence contracts/common.md#meaningful-documentation Evaluate the outer grid parameter while retaining the complete cross-course coefficients.
   * @evidence contracts/performance.md#efficient-algorithms For C cross-course controls and outer degree R, cost is O(CR²).
   * @evidence contracts/performance.md#reuse-equivalent-work Each returned cross coefficient is evaluated once from its corresponding grid column.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the resulting new polynomial net escapes the temporary columns.
   */
  export function gridValue(g: B.Grid, t: number): B.Poly {
    return g[0]!.map(
      (_: B.Vec, i: number): B.Vec =>
        B.value(
          g.map((p: B.Poly): B.Vec => p[i]!),
          t,
        ),
    );
  }
  /**
   * Differentiate the outer grid parameter using the supplied physical scale.
   *
   * @evidence contracts/common.md#principled-implementation Adjacent outer rows are subtracted and scaled by outer degree and chart factor.
   * @evidence contracts/common.md#clear-and-simple-design Grid differentiation composes degree-aware vector polynomial subtraction and scaling.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No finite-difference parameter step or sampled tangent is introduced.
   * @evidence contracts/common.md#meaningful-documentation Differentiate the outer grid parameter using the supplied physical scale.
   * @evidence contracts/performance.md#efficient-algorithms One polynomial subtraction/scaling per adjacent row determines cost.
   * @evidence contracts/performance.md#reuse-equivalent-work Differentiated rows remain reusable coefficient nets for later grid evaluations.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The new grid retains no source-row array references.
   */
  export function gridTangent(g: B.Grid, scale: number = 1): B.Grid {
    return g
      .slice(1)
      .map(
        (p: B.Poly, i: number): B.Poly =>
          B.scale(B.add(p, g[i]!, -1), (g.length - 1) * scale),
      );
  }
}
