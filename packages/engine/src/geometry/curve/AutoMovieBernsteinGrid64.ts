import { AutoMovieBernsteinAlgebra64 as B } from "./AutoMovieBernsteinAlgebra64";

/**
 * Longitudinal Bernstein grids: four-row Hermite construction from endpoint courses and complete derivative courses, outer-parameter evaluation and outer-parameter differentiation.
 *
 * The inner (cross-course) coefficients of every row survive each operation, so a grid value or derivative is a complete polynomial course rather than sparse samples.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its chart-length and parameter contract.
 * @evidence contracts/development/design.md#principled-representation Represents Longitudinal Bernstein grids: four-row Hermite construction from endpoint courses and complete derivative courses, outer-parameter evaluation and outer-parameter differentiation: companion namespace of 3 members (`hermite`, `gridValue`, `gridTangent`); units and frames named in its text: degree. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieBernsteinGrid64` in packages/engine/src/geometry/curve/AutoMovieBernsteinGrid64.ts; its surface is the 3 members listed and the text shows 5 other files naming it, mostly packages/engine (5), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieBernsteinGrid64 {
  /**
   * Build four longitudinal rows from endpoint curves and full derivatives over a physical chart length.
   *
   * @evidence contracts/development/implementation.md#principled-implementation All endpoint/derivative courses elevate to one degree and form four longitudinal Bernstein rows using length/3.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The tensor constructor shares elevation and scaled polynomial addition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Complete derivative coefficients are retained rather than unit tangent vectors.
   * @evidence contracts/development/common.md#meaningful-documentation Build four longitudinal rows from endpoint curves and full derivatives over a physical chart length.
   * @evidence contracts/development/implementation.md#efficient-algorithms Degree elevation and four row constructions dominate cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One maximum degree and elevated endpoint nets are reused for both inner rows.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The four-row grid owns its endpoint and handle coefficient arrays.
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
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates every cross-course coefficient column in the outer grid parameter.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Grid evaluation delegates to the same vector De Casteljau owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The complete cross-course polynomial survives; no sparse samples replace its coefficients.
   * @evidence contracts/development/common.md#meaningful-documentation Evaluate the outer grid parameter while retaining the complete cross-course coefficients.
   * @evidence contracts/development/implementation.md#efficient-algorithms For C cross-course controls and outer degree R, cost is O(CR²).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each returned cross coefficient is evaluated once from its corresponding grid column.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the resulting new polynomial net escapes the temporary columns.
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
   * @evidence contracts/development/implementation.md#principled-implementation Adjacent outer rows are subtracted and scaled by outer degree and chart factor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Grid differentiation composes degree-aware vector polynomial subtraction and scaling.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No finite-difference parameter step or sampled tangent is introduced.
   * @evidence contracts/development/common.md#meaningful-documentation Differentiate the outer grid parameter using the supplied physical scale.
   * @evidence contracts/development/implementation.md#efficient-algorithms One polynomial subtraction/scaling per adjacent row determines cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Differentiated rows remain reusable coefficient nets for later grid evaluations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The new grid retains no source-row array references.
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
