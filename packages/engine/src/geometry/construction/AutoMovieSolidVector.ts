/**
 * The vector algebra the solid operators share: world vectors in millimetres
 * as fixed triples, and the 3 by 3 and 2 by 2 linear solves their Newton steps
 * take.
 *
 * Inputs are read without mutation; vector results are fresh tuples. The
 * fixed 2 by 2 and 3 by 3 solves use Cramer's rule, and the general solve
 * uses partial-pivot Gaussian elimination. Their relative rejection tests
 * identify numerically small determinants or pivots, not exact rank or a
 * certified error bound. Callers supply finite, consistently scaled values
 * whose intermediate products remain representable, and decide what a null
 * solve means for the contact or chart they are constructing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each operation and the singularity tests.
 * @evidence contracts/development/design.md#principled-representation Represents The vector algebra the solid operators share: world vectors in millimetres as fixed triples, and the 3 by 3 and 2 by 2 linear solves their Newton steps take: companion namespace of 12 members (`Vec3`, `add`, `sub`, `scale`, `combine`, `dot`, ...); units and frames named in its text: world, frame, second, frames, newton. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidVector` in packages/engine/src/geometry/construction/AutoMovieSolidVector.ts; its surface is the 12 members listed and the text shows 54 other files naming it, mostly packages/engine (32), packages/human (13), test (9), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSolidVector {
  /**
   * Three Cartesian components: world points use mm; directions use the caller's scale.
   *
   * @evidence contracts/development/design.md#principled-representation A fixed triple represents three-dimensional points, displacements and directions in the operator's declared frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The tuple fixes component count without a wrapper allocation or hidden coordinate transform.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type adds no finite-value, unit-length or units guarantee; those depend on the operation and caller.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes physical point units from a direction's supplied scale.
   */
  export type Vec3 = [number, number, number];

  /**
   * The sum of two vectors.
   *
   * @param a First vector.
   * @param b Second vector.
   * @returns `a + b`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Adds corresponding Cartesian components; callers supply compatible frames and units.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Direct component arithmetic returns one tuple without a vector-object layer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Applies ordinary number addition without offsets, clamping or consumer branches.
   * @evidence contracts/development/common.md#meaningful-documentation Names both operands and the returned vector sum.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three additions take constant time and one three-number result.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A componentwise sum has no shared preparation or coordinated effects.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the fresh tuple; neither input is changed or retained.
   */
  export function add(a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /**
   * The difference of two vectors.
   *
   * @param a First vector.
   * @param b Second vector.
   * @returns `a - b`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Subtracts compatible Cartesian components, preserving the operand order used for displacements.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The three subtractions expose that order directly.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not reverse axes, snap small differences or adjust contacts.
   * @evidence contracts/development/common.md#meaningful-documentation Specifies a-b rather than an unsigned separation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and a fixed three-number output.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No interval, phase or request preparation is coordinated here.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new tuple and keeps no reference to either operand.
   */
  export function sub(a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /**
   * A vector times a scalar.
   *
   * @param a The vector.
   * @param k The scalar.
   * @returns `k a`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Scalar multiplication applies the same factor to all Cartesian components.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A plain tuple result leaves units and factor interpretation with the caller.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No component-specific factor or magnitude clamp changes the vector's direction law.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the factor and the multiplication order's mathematical result.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three products and one tuple use constant time and space.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This scalar operation owns no reusable phase or request state.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned tuple escapes; the supplied vector is read-only.
   */
  export function scale(a: Readonly<Vec3>, k: number): Vec3 {
    return [a[0] * k, a[1] * k, a[2] * k];
  }

  /**
   * A weighted sum of vectors, `sum_i k_i a_i`.
   *
   * @param terms Pairs of weight and vector.
   * @returns The sum; the zero vector for no terms.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Accumulates the supplied linear combination componentwise in input order; weights and vectors must have compatible units and representable products.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One accumulator handles arbitrary term counts and the empty sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves ordinary ordered floating-point summation without reweighting or fixture-dependent terms.
   * @evidence contracts/development/common.md#meaningful-documentation States the weight/vector pair format and zero result for no terms.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(T) work for T terms and O(1) accumulator storage avoid an intermediate vector per term.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each term's weight is read once and serves all three components in the same traversal.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh tuple and retains neither the term list nor its vector references.
   */
  export function combine(
    terms: readonly (readonly [number, Readonly<Vec3>])[],
  ): Vec3 {
    const out: Vec3 = [0, 0, 0];
    for (const [k, a] of terms) {
      out[0] += k * a[0];
      out[1] += k * a[1];
      out[2] += k * a[2];
    }
    return out;
  }

  /**
   * The dot product.
   *
   * @param a First vector.
   * @param b Second vector.
   * @returns `a . b`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The Euclidean Cartesian dot product multiplies matching components and sums them; finite inputs alone do not guarantee finite products.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The scalar formula is directly visible to projection and solve callers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Performs no normalization or conditioning adjustment hidden from the caller.
   * @evidence contracts/development/common.md#meaningful-documentation States the operand/result relation; the namespace explains arithmetic-scale premises.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three products and two additions use constant work without a result array.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No reusable preparation belongs to this scalar inner product.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a number without retaining state or inputs.
   */
  export function dot(a: Readonly<Vec3>, b: Readonly<Vec3>): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /**
   * The cross product.
   *
   * @param a First vector.
   * @param b Second vector.
   * @returns `a x b`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the right-handed Cartesian cross-product determinant in the supplied frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three explicit components keep the orientation convention with this algebra owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not choose a fallback normal for parallel vectors or normalize a small result.
   * @evidence contracts/development/common.md#meaningful-documentation Specifies the ordered a-cross-b operation used by orientation callers.
   * @evidence contracts/development/implementation.md#efficient-algorithms Six products and three subtractions take constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A single cross product coordinates no repeated operation or shared cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh three-number tuple and holds no operand references.
   */
  export function cross(a: Readonly<Vec3>, b: Readonly<Vec3>): Vec3 {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /**
   * The Euclidean length.
   *
   * @param a The vector.
   * @returns `|a|`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the Euclidean norm to Math.hypot rather than directly squaring components; the true norm can still exceed Number.MAX_VALUE.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The standard numeric primitive owns the three-component norm calculation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves Math.hypot's zero, nonfinite and overflow results rather than substituting a length.
   * @evidence contracts/development/common.md#meaningful-documentation Defines Euclidean length with the input's component units.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fixed-arity hypot call takes constant time and no output collection.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A norm reading coordinates no reusable preparation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only a number is returned; no input or handle is retained.
   */
  export function norm(a: Readonly<Vec3>): number {
    return Math.hypot(a[0], a[1], a[2]);
  }

  /**
   * The unit vector along a vector.
   *
   * @param a The vector.
   * The unit-length result requires a finite representable positive norm;
   * this routine does not apply max-component scaling for extreme inputs.
   *
   * @returns `a / |a|` when the computed norm is positive, otherwise null.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Divides components by the computed Euclidean norm under its finite positive norm premise; zero or NaN norm returns null.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One norm and one positive-length branch implement the nullable normalization result.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no arbitrary fallback direction; an infinite or heavily quantized norm is not repaired and does not establish a unit result.
   * @evidence contracts/development/common.md#meaningful-documentation States the positive-norm branch and the numerical limit instead of promising normalization for every finite triple.
   * @evidence contracts/development/implementation.md#efficient-algorithms One hypot and three divisions use constant work and at most one returned tuple.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Computes the norm once for all three component divisions.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Null or a caller-owned new triple escapes; no state survives the call.
   */
  export function unit(a: Readonly<Vec3>): Vec3 | null {
    const l: number = norm(a);
    return l > 0 ? [a[0] / l, a[1] / l, a[2] / l] : null;
  }

  /**
   * The solution of `[c0 c1 c2] x = b`, the matrix given by its columns, by
   * Cramer's rule.
   *
   * @param c0 First column.
   * @param c1 Second column.
   * @param c2 Third column.
   * @param b Right-hand side.
   * @returns `x`, or null when the determinant is under `1e-14` of the
   *   product of the columns' lengths (the columns nearly coplanar).
   *
   * @evidence contracts/development/implementation.md#principled-implementation Cramer's rule solves the fixed three-column system after a determinant-to-column-norm test; well-scaled representable products are required and the test is not an error certificate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed-size determinant formulas avoid a general elimination setup for this three-variable Newton step.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Returns null when the strict 1e-14 relative test fails, without regularizing or inventing a contact displacement.
   * @evidence contracts/development/common.md#meaningful-documentation Gives column orientation, the right-hand side and the exact rejection scale.
   * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of dot/cross/norm operations and small temporary triples take constant work and space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the accepted determinant in all three quotient components; cross-product temporaries are computed by the stated formulas rather than globally cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporaries die with the synchronous call; a successful solve returns a fresh triple without retaining matrix columns.
   */
  export function solve3(
    c0: Readonly<Vec3>,
    c1: Readonly<Vec3>,
    c2: Readonly<Vec3>,
    b: Readonly<Vec3>,
  ): Vec3 | null {
    const det: number = dot(c0, cross(c1, c2));
    const size: number = norm(c0) * norm(c1) * norm(c2);
    if (!(Math.abs(det) > 1e-14 * size)) return null;
    return [
      dot(b, cross(c1, c2)) / det,
      dot(c0, cross(b, c2)) / det,
      dot(c0, cross(c1, b)) / det,
    ];
  }

  /**
   * The solution of the symmetric or general 2 by 2 system
   * `[[a, b], [c, d]] x = r` by Cramer's rule.
   *
   * @param a Row 1, column 1.
   * @param b Row 1, column 2.
   * @param c Row 2, column 1.
   * @param d Row 2, column 2.
   * @param r Right-hand side.
   * @returns `x`, or null when the determinant is under `1e-14` of
   *   `|a d| + |b c|`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Applies the two-variable Cramer formulas with a relative determinant test against the two determinant products; finite representable products are a caller premise.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Four scalar entries and one two-component right-hand side expose the general matrix without a matrix class.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A failed strict 1e-14 test returns null rather than shifting the diagonal or returning an approximate regularized answer.
   * @evidence contracts/development/common.md#meaningful-documentation Specifies row/column order, output and the rejection expression.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar arithmetic and at most one two-number output replace a general solver for this fixed size.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The determinant is formed once and shared by both solution quotients.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns null or a new pair; no coefficient or right-hand-side reference is retained.
   */
  export function solve2(
    a: number,
    b: number,
    c: number,
    d: number,
    r: readonly [number, number],
  ): [number, number] | null {
    const det: number = a * d - b * c;
    if (!(Math.abs(det) > 1e-14 * (Math.abs(a * d) + Math.abs(b * c))))
      return null;
    return [(r[0] * d - b * r[1]) / det, (a * r[1] - c * r[0]) / det];
  }

  /**
   * The solution of a square system `M x = b` by Gaussian elimination with
   * partial pivoting, for the 4 by 4 systems of a curve traced by a declared
   * parameter.
   *
   * @param rows The matrix by rows, square; not modified.
   * @param b Right-hand side.
   * @returns `x`, or null when a pivot falls under `1e-14` of the largest
   *   entry of the matrix (the rows nearly dependent).
   *
   * @evidence contracts/development/implementation.md#principled-implementation Partial-pivot Gaussian elimination solves a finite square system with matching right-hand-side length; the fixed relative pivot threshold is an admission test, not a condition-number bound.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One copied augmented matrix contains elimination and back-substitution state while preserving caller inputs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pivot not greater than 1e-14 times the largest original entry returns null; there is no retry, regularization or hidden fallback system.
   * @evidence contracts/development/common.md#meaningful-documentation Gives square row layout, nonmutation, current four-variable workload and the pivot rejection rule.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N^3) elimination and O(N^2) copied storage use the standard dense method for the operators' small systems; no sparse or large-system optimality is claimed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each accepted pivot row eliminates every lower row in place, and back substitution reuses the resulting triangular matrix.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The augmented matrix and pivot temporaries are call-local on success or early null; only the O(N) solution array escapes.
   */
  export function solve(
    rows: readonly (readonly number[])[],
    b: readonly number[],
  ): number[] | null {
    const n: number = rows.length;
    const m: number[][] = rows.map(
      (r: readonly number[], i: number): number[] => [...r, b[i]!],
    );
    let largest: number = 0;
    for (const r of rows)
      for (const x of r) largest = Math.max(largest, Math.abs(x));
    for (let c: number = 0; c < n; c++) {
      let p: number = c;
      for (let r: number = c + 1; r < n; r++)
        if (Math.abs(m[r]![c]!) > Math.abs(m[p]![c]!)) p = r;
      if (!(Math.abs(m[p]![c]!) > 1e-14 * largest)) return null;
      [m[c], m[p]] = [m[p]!, m[c]!];
      for (let r: number = c + 1; r < n; r++) {
        const f: number = m[r]![c]! / m[c]![c]!;
        for (let k: number = c; k <= n; k++) m[r]![k]! -= f * m[c]![k]!;
      }
    }
    const x: number[] = new Array<number>(n).fill(0);
    for (let r: number = n - 1; r >= 0; r--) {
      let sum: number = m[r]![n]!;
      for (let k: number = r + 1; k < n; k++) sum -= m[r]![k]! * x[k]!;
      x[r] = sum / m[r]![r]!;
    }
    return x;
  }
}
