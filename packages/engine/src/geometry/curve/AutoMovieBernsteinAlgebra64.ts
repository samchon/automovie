import { AutoMovieCurveMath64 as V } from "./AutoMovieCurveMath64";

/**
 * Bernstein coefficient algebra in binary64 with explicit degree. Coefficient arrays are nonempty and corresponding finite values unless a member states a different case; callers own degree/index admission, parameter domains and representable intermediate arithmetic. Construction does not certify a regular curve or positive rational denominator.
 *
 * Degree elevation, multiplication, addition and differentiation preserve the algebraic polynomial before floating-point rounding; no sampled fit or cubic replacement is used. This internal algebra is shared by subdivision, longitudinal grids and the legacy public facade without circular initialization.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its coefficient/parameter contract and retained arithmetic path.
 * @evidence contracts/development/design.md#principled-representation Represents Bernstein coefficient algebra in binary64 with explicit degree: companion namespace of 17 members (`Vec`, `Poly`, `Grid`, `RecordV`, `RecordS`, `choose`, ...); units and frames named in its text: degree, rational, local, degrees, second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieBernsteinAlgebra64` in packages/engine/src/geometry/curve/AutoMovieBernsteinAlgebra64.ts; its surface is the 17 members listed and the text shows 16 other files naming it, mostly packages/engine (15), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export namespace AutoMovieBernsteinAlgebra64 {
  /**
   * Three-component coefficient values; positions and derivative fields retain the units owned by their enclosing chart.
   *
   * @evidence contracts/development/design.md#principled-representation A fixed three-component mutable coefficient value.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/development/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
   */
  export type Vec = V.V;

  /**
   * Ordered Bernstein vector coefficients, with degree equal to length minus one.
   *
   * @evidence contracts/development/design.md#principled-representation An ordered vector Bernstein coefficient array whose degree is length minus one.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/development/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
   */
  export type Poly = Vec[];

  /**
   * Tensor coefficient rows used only to derive curve courses and first variations.
   *
   * @evidence contracts/development/design.md#principled-representation An outer-parameter array of corresponding vector Bernstein rows.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/development/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
   */
  export type Grid = Poly[];

  /**
   * A rational vector field N/Q; the denominator must remain positive on the evaluated chart.
   *
   * @evidence contracts/development/design.md#principled-representation A vector homogeneous numerator and scalar denominator sharing one local quotient parameter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/development/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
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
   * @evidence contracts/development/design.md#principled-representation A scalar numerator and denominator sharing one local quotient parameter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/development/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
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
   * @evidence contracts/development/implementation.md#principled-implementation Multiplies the k binomial factors in ascending i order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A direct multiplicative coefficient helper serves the product convolution.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No factorial overflow path or approximate combinatorial lookup replaces the stated arithmetic.
   * @evidence contracts/development/common.md#meaningful-documentation Return a binomial coefficient used by exact Bernstein-product algebra before floating rounding.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(k) scalar operations; caller-supplied nonnegative integer degree/index are premises.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Product terms consume the same binomial definition; this operation schedules no cross-request work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only one scalar accumulator survives the loop.
   */
  export function choose(n: number, k: number): number {
    let v: number = 1;
    for (let i: number = 1; i <= k; i++) v *= (n - i + 1) / i;
    return v;
  }
  /**
   * Evaluate scalar Bernstein coefficients, preserving supplied coefficients at t=0 and t=1.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Bernstein endpoint identities select the first or last coefficient directly; other parameters use scalar De Casteljau levels a+t(b-a). Canonical boundaries compare shared endpoint identities exactly, so repeating affine arithmetic at an endpoint must not invent a different coefficient.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Degrees up to three use scalar locals for the same De Casteljau levels; higher degrees reduce one private coefficient row. Neither path mutates the supplied polynomial.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sampling fit, parameter clamp or degree reduction is performed.
   * @evidence contracts/development/common.md#meaningful-documentation States exact endpoint coefficient identity and the unchanged De Casteljau path for other parameters, including extrapolation; the coefficient array is nonempty.
   * @evidence contracts/development/implementation.md#efficient-algorithms Endpoint selection is constant work. Degrees zero through three use at most six affine blends without a heap row; higher degrees require O(n²) blends and one O(n) coefficient copy for degree n, without per-level allocation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Short nets keep successive levels in scalar locals, with the quadratic tail shared by degrees two and three. Ascending indices for higher degrees read each previous level's right neighbour before overwriting it. Both retain the same a+t(b-a) arithmetic and read original controls once; no cross-parameter cache survives.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Short nets retain at most four scalar locals; the private row for higher degrees expires after evaluation. Only a scalar escapes.
   */
  export function scalar(c: readonly number[], t: number): number {
    if (t === 0) return c[0]!;
    if (t === 1) return c.at(-1)!;
    if (c.length === 1) return c[0]!;
    if (c.length === 2) {
      const first: number = c[0]!,
        second: number = c[1]!;
      return first + t * (second - first);
    }
    if (c.length === 3 || c.length === 4) {
      let first: number = c[0]!,
        second: number = c[1]!,
        third: number = c[2]!;
      if (c.length === 4) {
        const fourth: number = c[3]!;
        first = first + t * (second - first);
        second = second + t * (third - second);
        third = third + t * (fourth - third);
      }
      first = first + t * (second - first);
      second = second + t * (third - second);
      return first + t * (second - first);
    }
    const row: number[] = [...c];
    for (let length: number = row.length; length > 1; length--)
      for (let i: number = 0; i + 1 < length; i++)
        row[i] = row[i]! + t * (row[i + 1]! - row[i]!);
    return row[0]!;
  }
  /**
   * Evaluate nonempty vector Bernstein coefficients with copied exact endpoints.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The Bernstein identities at t=0 and t=1 return a clone of the supplied endpoint. All other parameters repeat the same affine De Casteljau operation in all three coordinates. This retains the coefficient identity required by canonical boundary incidence without changing interior or extrapolation arithmetic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The input net is cloned before reduction through neighboring rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sampled cubic or coordinate normalization replaces the supplied degree.
   * @evidence contracts/development/common.md#meaningful-documentation States the nonempty input, exact endpoint identity, unchanged nonterminal arithmetic and alias-free returned vector.
   * @evidence contracts/development/implementation.md#efficient-algorithms Endpoint evaluation copies one vector; other parameters require O(n²) three-component blends for degree n.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each reduction row supplies the complete next level in the same evaluation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned vector belongs to the local cloned/evaluated net, with no input alias.
   */
  export function value(c: readonly Vec[], t: number): Vec {
    if (t === 0) return V.clone(c[0]!);
    if (t === 1) return V.clone(c.at(-1)!);
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
   * @evidence contracts/development/implementation.md#principled-implementation Adjacent coefficient differences are multiplied by degree and the caller chart-scale factor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The differentiated net remains an ordinary vector Bernstein polynomial.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Derivative magnitudes and chart units are not normalized away.
   * @evidence contracts/development/common.md#meaningful-documentation Differentiate vector coefficients and apply the caller chart-scale factor.
   * @evidence contracts/development/implementation.md#efficient-algorithms One vector difference per adjacent pair gives O(n) work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Derivative coefficients can be reused by quotient and grid callers without finite differences.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only newly allocated derivative triples escape.
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
   * @evidence contracts/development/implementation.md#principled-implementation Adjacent scalar differences are multiplied by degree and chart scale; a constant differentiates to zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Scalar differentiation shares Bernstein ordering with scalar evaluation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sampled difference or nonzero constant derivative is introduced.
   * @evidence contracts/development/common.md#meaningful-documentation Differentiate scalar coefficients; a constant returns the zero constant.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pass over n adjacent pairs, O(n).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The derivative net is returned as reusable coefficients.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A fresh scalar array retains neither the source net nor a parameter.
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
   * @evidence contracts/development/implementation.md#principled-implementation Repeated degree elevation blends adjacent coefficients with i/n and 1-i/n and preserves endpoints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar degree-elevation owner is reused by vector and sum operations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Requested degree reduction rejects rather than fitting lower-degree coefficients.
   * @evidence contracts/development/common.md#meaningful-documentation Raise scalar degree without changing its polynomial; a requested reduction rejects.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each added degree requires a pass over its new coefficient row.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The most recently elevated row supplies the next step, with no restart from the original degree.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the final new coefficient array escapes the invocation.
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
   * @evidence contracts/development/implementation.md#principled-implementation Each of three coordinate columns receives the same scalar degree elevation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Coordinate-column assembly delegates elevation to the scalar owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All coordinates keep one common target degree, without independent approximation.
   * @evidence contracts/development/common.md#meaningful-documentation Raise each vector coordinate to one common Bernstein degree.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three scalar elevations dominate time, plus linear row transposition.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The elevated coordinate columns are each computed once for the returned net.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Output triples are independent of input controls and temporary columns expire.
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
   * @evidence contracts/development/implementation.md#principled-implementation Binomial-weighted convolution accumulates every contributing coefficient pair in ascending i order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar product supplies both scalar and vector rational algebra.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pointwise sampled multiplication or reduced-degree replacement substitutes for the exact coefficient formula.
   * @evidence contracts/development/common.md#meaningful-documentation Multiply scalar Bernstein polynomials using binomial-weighted convolution.
   * @evidence contracts/development/implementation.md#efficient-algorithms For degrees m and n, convolution enumerates contributing pairs; choose computes each binomial factor without retained lookup tables.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No effectful work or cross-request cache is coordinated; each product depends on its current coefficient values.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the degree m+n scalar output array is returned.
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
   * @evidence contracts/development/implementation.md#principled-implementation Each vector coordinate is multiplied by the supplied scalar polynomial using the same convolution.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Vector multiplication delegates its three scalar columns to product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Coefficient degree and original coordinate ordering are preserved.
   * @evidence contracts/development/common.md#meaningful-documentation Multiply each vector coordinate by a scalar Bernstein polynomial.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three scalar convolutions dominate cost and result storage is linear in output degree.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A scalar numerator is reused as the operand of each coordinate product within this call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The new vector net does not retain either operand.
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
   * @evidence contracts/development/implementation.md#principled-implementation Both vector polynomials elevate to the common maximum degree before adding factor-scaled coefficients.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Degree reconciliation is delegated to the shared elevation owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unequal degrees are not padded with zeros or compared as sampled points.
   * @evidence contracts/development/common.md#meaningful-documentation Elevate to a common degree, then add the scaled vector polynomial.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two degree elevations plus one output-row pass determine cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The common degree is resolved once for both operands.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only independent summed triples escape; elevated operands are local.
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
   * @evidence contracts/development/implementation.md#principled-implementation Scalar operands elevate to the same maximum degree before scaled addition.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Scalar sums reuse scalar elevation rather than a second degree-conversion rule.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coefficient padding or sampled fitting changes the operands.
   * @evidence contracts/development/common.md#meaningful-documentation Elevate to a common degree, then add the scaled scalar polynomial.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two scalar elevations and one coefficient pass determine cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One common degree is shared by both current operands.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The new sum array retains neither operand nor elevation scratch arrays.
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
   * @evidence contracts/development/implementation.md#principled-implementation Every coefficient vector is multiplied by the same scalar.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Degree-preserving scaling is distinct from chart reparameterization.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No component or coefficient is omitted by a small-value cutoff.
   * @evidence contracts/development/common.md#meaningful-documentation Multiply every vector coefficient by the same scalar without changing degree.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fixed-size vector operation per control gives O(n) work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The current factor is applied directly without retaining previous products.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A new vector net owns the scaled controls.
   */
  export function scale(a: readonly Vec[], factor: number): Poly {
    return a.map((p: Vec): Vec => V.scale(p, factor));
  }
}
