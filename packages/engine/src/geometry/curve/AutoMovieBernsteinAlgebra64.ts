import { AutoMovieCurveMath64 as V } from "./AutoMovieCurveMath64";

/**
 * Bernstein coefficient algebra in binary64 with explicit degree. Coefficient arrays are nonempty and corresponding finite values unless a member states a different case; callers own degree/index admission, parameter domains and representable intermediate arithmetic. Construction does not certify a regular curve or positive rational denominator.
 *
 * Degree elevation, multiplication, addition and differentiation preserve the algebraic polynomial before floating-point rounding; no sampled fit or cubic replacement is used. This internal algebra is shared by subdivision, longitudinal grids and the legacy public facade without circular initialization.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Bernstein evaluation, degree elevation, products and derivatives operate directly on coefficient arrays.
 * @evidence contracts/common.md#clear-and-simple-design A stateless namespace composes the scalar and vector coefficient operations without an anatomical dependency.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampled fit, arbitrary degree reduction or Human chart convention enters this algebra.
 * @evidence contracts/common.md#meaningful-documentation Each member states its coefficient/parameter contract and retained arithmetic path.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Members state degree-dependent costs; a namespace declaration computes nothing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The namespace stores no cross-call result table.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No geometry, model, scene or lifetime handle is owned by the namespace.
 */
export namespace AutoMovieBernsteinAlgebra64 {
  /**
   * Three-component coefficient values; positions and derivative fields retain the units owned by their enclosing chart.
   *
   * @evidence contracts/common.md#principled-implementation A fixed three-component mutable coefficient value.
   * @evidence contracts/common.md#clear-and-simple-design One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A coefficient type performs no arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no memoization or work coordination.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type retains no coefficient array at runtime.
   */
  export type Vec = V.V;

  /**
   * Ordered Bernstein vector coefficients, with degree equal to length minus one.
   *
   * @evidence contracts/common.md#principled-implementation An ordered vector Bernstein coefficient array whose degree is length minus one.
   * @evidence contracts/common.md#clear-and-simple-design One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A coefficient type performs no arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no memoization or work coordination.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type retains no coefficient array at runtime.
   */
  export type Poly = Vec[];

  /**
   * Tensor coefficient rows used only to derive curve courses and first variations.
   *
   * @evidence contracts/common.md#principled-implementation An outer-parameter array of corresponding vector Bernstein rows.
   * @evidence contracts/common.md#clear-and-simple-design One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A coefficient type performs no arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no memoization or work coordination.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type retains no coefficient array at runtime.
   */
  export type Grid = Poly[];

  /**
   * A rational vector field N/Q; the denominator must remain positive on the evaluated chart.
   *
   * @evidence contracts/common.md#principled-implementation A vector homogeneous numerator and scalar denominator sharing one local quotient parameter.
   * @evidence contracts/common.md#clear-and-simple-design One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A coefficient type performs no arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no memoization or work coordination.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type retains no coefficient array at runtime.
   * @author Samchon
   */
  export interface RecordV {
    /** Homogeneous vector numerator coefficients. */
    numerator: Poly;

    /** Scalar denominator coefficients in the same parameter. */
    denominator: number[];
  }
  /**
   * A rational scalar transition N/Q in the same local parameter as its numerator.
   *
   * @evidence contracts/common.md#principled-implementation A scalar numerator and denominator sharing one local quotient parameter.
   * @evidence contracts/common.md#clear-and-simple-design One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A coefficient type performs no arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type owns no memoization or work coordination.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type retains no coefficient array at runtime.
   * @author Samchon
   */
  export interface RecordS {
    /** Homogeneous scalar numerator coefficients. */
    numerator: number[];

    /** Scalar denominator coefficients in the same parameter. */
    denominator: number[];
  }
  /**
   * Return a binomial coefficient for integer indices 0<=k<=n; callers own finite representability of the multiplicative factors.
   *
   * @evidence contracts/common.md#principled-implementation Multiplies the k binomial factors in ascending i order.
   * @evidence contracts/common.md#clear-and-simple-design A direct multiplicative coefficient helper serves the product convolution.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No factorial overflow path or approximate combinatorial lookup replaces the stated arithmetic.
   * @evidence contracts/common.md#meaningful-documentation Return a binomial coefficient used by exact Bernstein-product algebra before floating rounding.
   * @evidence contracts/performance.md#efficient-algorithms O(k) scalar operations; caller-supplied nonnegative integer degree/index are premises.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Product terms consume the same binomial definition; this operation schedules no cross-request work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only one scalar accumulator survives the loop.
   */
  export function choose(n: number, k: number): number {
    let v: number = 1;
    for (let i: number = 1; i <= k; i++) v *= (n - i + 1) / i;
    return v;
  }
  /**
   * Evaluate scalar Bernstein coefficients by De Casteljau at local parameter t.
   *
   * @evidence contracts/common.md#principled-implementation Scalar De Casteljau levels use a+t(b-a) on neighboring coefficients.
   * @evidence contracts/common.md#clear-and-simple-design Evaluation owns a private coefficient row instead of mutating the polynomial.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampling fit, parameter clamp or degree reduction is performed.
   * @evidence contracts/common.md#meaningful-documentation Evaluate scalar Bernstein coefficients by De Casteljau at local parameter t.
   * @evidence contracts/performance.md#efficient-algorithms Degree n requires O(n²) affine blends; each level reads the preceding row.
   * @evidence contracts/performance.md#reuse-equivalent-work The current row is shared by all coefficients of its next level; no cross-parameter cache is retained.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local level arrays expire after evaluation and only a scalar escapes.
   */
  export function scalar(c: readonly number[], t: number): number {
    let row: number[] = [...c];
    while (row.length > 1)
      row = row
        .slice(0, -1)
        .map((a: number, i: number): number => a + t * (row[i + 1]! - a));
    return row[0]!;
  }
  /**
   * Evaluate vector Bernstein coefficients by De Casteljau without sampling or degree reduction.
   *
   * @evidence contracts/common.md#principled-implementation Vector De Casteljau repeats the same affine coefficient operation in all three coordinates.
   * @evidence contracts/common.md#clear-and-simple-design The input net is cloned before reduction through neighboring rows.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampled cubic or coordinate normalization replaces the supplied degree.
   * @evidence contracts/common.md#meaningful-documentation Evaluate vector Bernstein coefficients by De Casteljau without sampling or degree reduction.
   * @evidence contracts/performance.md#efficient-algorithms Degree n requires O(n²) three-component blends.
   * @evidence contracts/performance.md#reuse-equivalent-work Each reduction row supplies the complete next level in the same evaluation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned vector belongs to the local cloned/evaluated net, with no input alias.
   */
  export function value(c: readonly Vec[], t: number): Vec {
    let row: Vec[] = c.map(V.clone);
    while (row.length > 1)
      row = row
        .slice(0, -1)
        .map((a: Vec, i: number): Vec => V.mix(a, row[i + 1]!, t));
    return row[0]!;
  }
  /**
   * Differentiate vector coefficients and apply the caller chart-scale factor. A constant produces an empty vector coefficient array; evaluating that array is outside value()'s nonempty-input contract.
   *
   * @evidence contracts/common.md#principled-implementation Adjacent coefficient differences are multiplied by degree and the caller chart-scale factor.
   * @evidence contracts/common.md#clear-and-simple-design The differentiated net remains an ordinary vector Bernstein polynomial.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Derivative magnitudes and chart units are not normalized away.
   * @evidence contracts/common.md#meaningful-documentation Differentiate vector coefficients and apply the caller chart-scale factor.
   * @evidence contracts/performance.md#efficient-algorithms One vector difference per adjacent pair gives O(n) work.
   * @evidence contracts/performance.md#reuse-equivalent-work Derivative coefficients can be reused by quotient and grid callers without finite differences.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only newly allocated derivative triples escape.
   */
  export function tangent(c: readonly Vec[], scale: number = 1): Poly {
    return c
      .slice(1)
      .map(
        (p: Vec, i: number): Vec =>
          V.scale(V.sub(p, c[i]!), (c.length - 1) * scale),
      );
  }
  /**
   * Differentiate scalar coefficients; a constant returns the zero constant.
   *
   * @evidence contracts/common.md#principled-implementation Adjacent scalar differences are multiplied by degree and chart scale; a constant differentiates to zero.
   * @evidence contracts/common.md#clear-and-simple-design Scalar differentiation shares Bernstein ordering with scalar evaluation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampled difference or nonzero constant derivative is introduced.
   * @evidence contracts/common.md#meaningful-documentation Differentiate scalar coefficients; a constant returns the zero constant.
   * @evidence contracts/performance.md#efficient-algorithms One pass over n adjacent pairs, O(n).
   * @evidence contracts/performance.md#reuse-equivalent-work The derivative net is returned as reusable coefficients.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A fresh scalar array retains neither the source net nor a parameter.
   */
  export function dScalar(c: readonly number[], scale: number = 1): number[] {
    return c.length === 1
      ? [0]
      : c
          .slice(1)
          .map(
            (p: number, i: number): number =>
              (p - c[i]!) * (c.length - 1) * scale,
          );
  }
  /**
   * Raise scalar degree without changing its polynomial; a requested reduction rejects.
   *
   * @evidence contracts/common.md#principled-implementation Repeated degree elevation blends adjacent coefficients with i/n and 1-i/n and preserves endpoints.
   * @evidence contracts/common.md#clear-and-simple-design One scalar degree-elevation owner is reused by vector and sum operations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Requested degree reduction rejects rather than fitting lower-degree coefficients.
   * @evidence contracts/common.md#meaningful-documentation Raise scalar degree without changing its polynomial; a requested reduction rejects.
   * @evidence contracts/performance.md#efficient-algorithms Each added degree requires a pass over its new coefficient row.
   * @evidence contracts/performance.md#reuse-equivalent-work The most recently elevated row supplies the next step, with no restart from the original degree.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the final new coefficient array escapes the invocation.
   */
  export function elevateScalar(
    c: readonly number[],
    degree: number,
  ): number[] {
    if (degree < c.length - 1)
      throw new Error("Degree reduction is not an elevation");
    let out: number[] = [...c];
    while (out.length <= degree) {
      const n: number = out.length;
      out = Array.from({ length: n + 1 }, (_: unknown, i: number): number =>
        i === 0
          ? out[0]!
          : i === n
            ? out[n - 1]!
            : (i / n) * out[i - 1]! + (1 - i / n) * out[i]!,
      );
    }
    return out;
  }
  /**
   * Raise each vector coordinate to one common Bernstein degree.
   *
   * @evidence contracts/common.md#principled-implementation Each of three coordinate columns receives the same scalar degree elevation.
   * @evidence contracts/common.md#clear-and-simple-design Coordinate-column assembly delegates elevation to the scalar owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts All coordinates keep one common target degree, without independent approximation.
   * @evidence contracts/common.md#meaningful-documentation Raise each vector coordinate to one common Bernstein degree.
   * @evidence contracts/performance.md#efficient-algorithms Three scalar elevations dominate time, plus linear row transposition.
   * @evidence contracts/performance.md#reuse-equivalent-work The elevated coordinate columns are each computed once for the returned net.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Output triples are independent of input controls and temporary columns expire.
   */
  export function elevate(c: readonly Vec[], degree: number): Poly {
    const axes: number[][] = [0, 1, 2].map((k: number): number[] =>
      elevateScalar(
        c.map((p: Vec): number => p[k]!),
        degree,
      ),
    );
    return axes[0]!.map(
      (_: number, i: number): Vec =>
        axes.map((a: number[]): number => a[i]!) as Vec,
    );
  }
  /**
   * Multiply scalar Bernstein polynomials using binomial-weighted convolution.
   *
   * @evidence contracts/common.md#principled-implementation Binomial-weighted convolution accumulates every contributing coefficient pair in ascending i order.
   * @evidence contracts/common.md#clear-and-simple-design One scalar product supplies both scalar and vector rational algebra.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No pointwise sampled multiplication or reduced-degree replacement substitutes for the exact coefficient formula.
   * @evidence contracts/common.md#meaningful-documentation Multiply scalar Bernstein polynomials using binomial-weighted convolution.
   * @evidence contracts/performance.md#efficient-algorithms For degrees m and n, convolution enumerates contributing pairs; choose computes each binomial factor without retained lookup tables.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No effectful work or cross-request cache is coordinated; each product depends on its current coefficient values.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the degree m+n scalar output array is returned.
   */
  export function product(
    a: readonly number[],
    b: readonly number[],
  ): number[] {
    const m: number = a.length - 1,
      n: number = b.length - 1;
    return Array.from(
      { length: m + n + 1 },
      (_: unknown, k: number): number => {
        let sum: number = 0;
        for (let i: number = Math.max(0, k - n); i <= Math.min(m, k); i++)
          sum +=
            ((choose(m, i) * choose(n, k - i)) / choose(m + n, k)) *
            a[i]! *
            b[k - i]!;
        return sum;
      },
    );
  }
  /**
   * Multiply each vector coordinate by a scalar Bernstein polynomial.
   *
   * @evidence contracts/common.md#principled-implementation Each vector coordinate is multiplied by the supplied scalar polynomial using the same convolution.
   * @evidence contracts/common.md#clear-and-simple-design Vector multiplication delegates its three scalar columns to product.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Coefficient degree and original coordinate ordering are preserved.
   * @evidence contracts/common.md#meaningful-documentation Multiply each vector coordinate by a scalar Bernstein polynomial.
   * @evidence contracts/performance.md#efficient-algorithms Three scalar convolutions dominate cost and result storage is linear in output degree.
   * @evidence contracts/performance.md#reuse-equivalent-work A scalar numerator is reused as the operand of each coordinate product within this call.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The new vector net does not retain either operand.
   */
  export function productV(a: readonly number[], b: readonly Vec[]): Poly {
    const axes: number[][] = [0, 1, 2].map((k: number): number[] =>
      product(
        a,
        b.map((p: Vec): number => p[k]!),
      ),
    );
    return axes[0]!.map(
      (_: number, i: number): Vec =>
        axes.map((p: number[]): number => p[i]!) as Vec,
    );
  }
  /**
   * Elevate to a common degree, then add the scaled vector polynomial.
   *
   * @evidence contracts/common.md#principled-implementation Both vector polynomials elevate to the common maximum degree before adding factor-scaled coefficients.
   * @evidence contracts/common.md#clear-and-simple-design Degree reconciliation is delegated to the shared elevation owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unequal degrees are not padded with zeros or compared as sampled points.
   * @evidence contracts/common.md#meaningful-documentation Elevate to a common degree, then add the scaled vector polynomial.
   * @evidence contracts/performance.md#efficient-algorithms Two degree elevations plus one output-row pass determine cost.
   * @evidence contracts/performance.md#reuse-equivalent-work The common degree is resolved once for both operands.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only independent summed triples escape; elevated operands are local.
   */
  export function add(
    a: readonly Vec[],
    b: readonly Vec[],
    factor: number = 1,
  ): Poly {
    const degree: number = Math.max(a.length, b.length) - 1,
      x: Poly = elevate(a, degree),
      y: Poly = elevate(b, degree);
    return x.map((p: Vec, i: number): Vec => V.add(p, V.scale(y[i]!, factor)));
  }
  /**
   * Elevate to a common degree, then add the scaled scalar polynomial.
   *
   * @evidence contracts/common.md#principled-implementation Scalar operands elevate to the same maximum degree before scaled addition.
   * @evidence contracts/common.md#clear-and-simple-design Scalar sums reuse scalar elevation rather than a second degree-conversion rule.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No coefficient padding or sampled fitting changes the operands.
   * @evidence contracts/common.md#meaningful-documentation Elevate to a common degree, then add the scaled scalar polynomial.
   * @evidence contracts/performance.md#efficient-algorithms Two scalar elevations and one coefficient pass determine cost.
   * @evidence contracts/performance.md#reuse-equivalent-work One common degree is shared by both current operands.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The new sum array retains neither operand nor elevation scratch arrays.
   */
  export function addS(
    a: readonly number[],
    b: readonly number[],
    factor: number = 1,
  ): number[] {
    const degree: number = Math.max(a.length, b.length) - 1,
      x: number[] = elevateScalar(a, degree),
      y: number[] = elevateScalar(b, degree);
    return x.map((p: number, i: number): number => p + factor * y[i]!);
  }
  /**
   * Multiply every vector coefficient by the same scalar without changing degree.
   *
   * @evidence contracts/common.md#principled-implementation Every coefficient vector is multiplied by the same scalar.
   * @evidence contracts/common.md#clear-and-simple-design Degree-preserving scaling is distinct from chart reparameterization.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No component or coefficient is omitted by a small-value cutoff.
   * @evidence contracts/common.md#meaningful-documentation Multiply every vector coefficient by the same scalar without changing degree.
   * @evidence contracts/performance.md#efficient-algorithms One fixed-size vector operation per control gives O(n) work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The current factor is applied directly without retaining previous products.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A new vector net owns the scaled controls.
   */
  export function scale(a: readonly Vec[], factor: number): Poly {
    return a.map((p: Vec): Vec => V.scale(p, factor));
  }
}
