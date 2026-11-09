/**
 * Finite row-major 3-by-3 algebra for original-design numerical consumers.
 * These arrays use row-major order, unlike the scene Matrix4 column convention.
 * Operations copy their outputs and throw on malformed or unrepresentable data.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States storage order, borrowing, finite-range failures and the difference from scene Matrix4.
 * @evidence contracts/development/design.md#principled-representation Represents Finite row-major 3-by-3 algebra for original-design numerical consumers: companion namespace of 4 members (`skew`, `multiply`, `transpose`, `apply`). It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieMatrix3` in packages/engine/src/math/AutoMovieMatrix3.ts; its surface is the 4 members listed and the text shows 19 other files naming it, mostly packages/recovery (15), test (3), packages/engine (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieMatrix3 {
  /**
   * Matrix whose action on x is the right-handed cross product vector cross x.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The antisymmetric row-major arrangement expands the Cartesian cross product with the supplied vector as its left operand.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One explicit cross-product matrix supports numerical linear-map derivatives without renderer or camera conventions.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every finite component keeps its original magnitude and sign; the vector is not normalized or interpreted as an angle.
   * @evidence contracts/development/common.md#meaningful-documentation States operand order, handedness, row order and unchanged vector magnitude.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size admission and nine scalar entries require constant work and storage.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mutable vector has no retained matrix identity or shared cross-call work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only a fresh nine-number array escapes; no operand or external resource is retained.
   */
  export function skew(vector: readonly number[]): number[] {
    if (!Array.isArray(vector) || vector.length !== 3)
      throw new Error(
        "matrix3: finite three-coordinate cross-product operand required",
      );
    for (let at: number = 0; at < 3; at++)
      if (!Number.isFinite(vector[at]))
        throw new Error(
          "matrix3: finite three-coordinate cross-product operand required",
        );
    return [
      0,
      -vector[2]!,
      vector[1]!,
      vector[2]!,
      0,
      -vector[0]!,
      -vector[1]!,
      vector[0]!,
      0,
    ];
  }

  /**
   * Multiply two finite row-major arrays without changing either operand.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The (row,column) output is the three-term dot product of the left row and right column. Finite operands do not guarantee a representable product, so nonfinite outputs throw.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed product supplies numerical composition without scene transform conventions.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No product term is capped or silently rescaled and no invalid operand becomes identity.
   * @evidence contracts/development/common.md#meaningful-documentation States row-major order, unchanged operands and finite-output refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Computes 27 scalar products and nine three-term sums after fixed-size admission, retaining one nine-number result.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This pure product has no shared mutable-input cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the owned nine-number result escapes; no resource is acquired.
   */
  export function multiply(
    left: readonly number[],
    right: readonly number[],
  ): number[] {
    if (
      !Array.isArray(left) ||
      !Array.isArray(right) ||
      left.length !== 9 ||
      right.length !== 9
    )
      throw new Error(
        "matrix3: two complete finite row-major matrices required",
      );
    for (let at: number = 0; at < 9; at++)
      if (!Number.isFinite(left[at]) || !Number.isFinite(right[at]))
        throw new Error(
          "matrix3: two complete finite row-major matrices required",
        );
    const result: number[] = new Array<number>(9).fill(0);
    for (let row: number = 0; row < 3; row++) {
      for (let column: number = 0; column < 3; column++) {
        for (let at: number = 0; at < 3; at++)
          result[3 * row + column] +=
            left[3 * row + at]! * right[3 * at + column]!;
      }
    }
    if (!result.every(Number.isFinite))
      throw new Error("matrix3: product is not representable");
    return result;
  }

  /**
   * Swap row and column indices into a fresh finite nine-number array.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Index permutation computes the exact transpose of the supplied doubles without arithmetic or a change of coordinate units.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The common row/column interchange is explicit at every numerical composition site.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No order-dependent mutation or implicit inverse replaces the transpose.
   * @evidence contracts/development/common.md#meaningful-documentation States new ownership and row-major index meaning.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copies nine admitted values in constant work and storage.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Transpose coordinates no work across requests.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A fresh nine-number array escapes and no other state persists.
   */
  export function transpose(matrix: readonly number[]): number[] {
    if (!Array.isArray(matrix) || matrix.length !== 9)
      throw new Error("matrix3: complete finite row-major matrix required");
    for (let at: number = 0; at < 9; at++)
      if (!Number.isFinite(matrix[at]))
        throw new Error("matrix3: complete finite row-major matrix required");
    return [
      matrix[0]!,
      matrix[3]!,
      matrix[6]!,
      matrix[1]!,
      matrix[4]!,
      matrix[7]!,
      matrix[2]!,
      matrix[5]!,
      matrix[8]!,
    ];
  }

  /**
   * Apply a row-major matrix to a finite three-coordinate column vector.
   * The returned third coordinate is retained; no projective divide is performed.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Three row dot products compute ordinary linear action, including a homogeneous vector when the caller supplies one. Nonfinite output throws rather than becoming a point at a guessed depth.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Explicit retained homogeneous coordinates let the projection owner test its own denominator and visibility.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No homogeneous divide, normalization or small-denominator compensation changes the supplied linear map.
   * @evidence contracts/development/common.md#meaningful-documentation Gives vector orientation, third-coordinate retention, borrowing and finite-range refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Nine multiplications and fixed-size admission produce one three-number tuple.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Mutable inputs have no retained application cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The new tuple transfers to its caller and no handle or shared state remains.
   */
  export function apply(
    matrix: readonly number[],
    vector: readonly number[],
  ): [number, number, number] {
    if (
      !Array.isArray(matrix) ||
      !Array.isArray(vector) ||
      matrix.length !== 9 ||
      vector.length !== 3
    )
      throw new Error(
        "matrix3: complete finite matrix and three-coordinate vector required",
      );
    for (let at: number = 0; at < 9; at++)
      if (!Number.isFinite(matrix[at]))
        throw new Error(
          "matrix3: complete finite matrix and three-coordinate vector required",
        );
    for (let at: number = 0; at < 3; at++)
      if (!Number.isFinite(vector[at]))
        throw new Error(
          "matrix3: complete finite matrix and three-coordinate vector required",
        );
    const result: [number, number, number] = [
      matrix[0]! * vector[0]! +
        matrix[1]! * vector[1]! +
        matrix[2]! * vector[2]!,
      matrix[3]! * vector[0]! +
        matrix[4]! * vector[1]! +
        matrix[5]! * vector[2]!,
      matrix[6]! * vector[0]! +
        matrix[7]! * vector[1]! +
        matrix[8]! * vector[2]!,
    ];
    if (!result.every(Number.isFinite))
      throw new Error("matrix3: vector product is not representable");
    return result;
  }
}
