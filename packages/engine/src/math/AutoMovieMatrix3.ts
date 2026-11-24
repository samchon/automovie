/**
 * Finite row-major 3-by-3 algebra for original-design numerical consumers.
 * These arrays use row-major order, unlike the scene Matrix4 column convention.
 * Operations copy their outputs and throw on malformed or unrepresentable
 * data.
 */
export namespace AutoMovieMatrix3 {
  /** Matrix whose action on x is the right-handed cross product vector cross x. */
  export function skew(vector: readonly number[]): number[] {
    if (!Array.isArray(vector) || vector.length !== 3)
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

  /** Multiply two finite row-major arrays without changing either operand. */
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
    const result: number[] = new Array<number>(9).fill(0);
    for (let row: number = 0; row < 3; row++) {
      for (let column: number = 0; column < 3; column++) {
        for (let at: number = 0; at < 3; at++)
          result[3 * row + column] +=
            left[3 * row + at]! * right[3 * at + column]!;
      }
    }
    return result;
  }

  /** Swap row and column indices into a fresh finite nine-number array. */
  export function transpose(matrix: readonly number[]): number[] {
    if (!Array.isArray(matrix) || matrix.length !== 9)
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
   * Apply a row-major matrix to a finite three-coordinate column vector. The
   * returned third coordinate is retained; no projective divide is performed.
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
    return result;
  }
}
