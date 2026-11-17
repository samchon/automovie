/**
 * Intersect a Euclidean unit normal with a compactified bitangent conic family. The barycentric point and normal use the endpoint tangent triangle; normal coordinates have inverse-millimetre units. For rho=w/(1+w), the implicit conic is (1-rho)^2*l1^2-4*rho^2*l0*l2=0. At rho=1 this is the union of the triangle's two tangent edges, used only as a boundary search limit. A finite normal displacement is returned only for a unique intersection in the positive tangent triangle. Two distinct valid roots remain unsupported; a double algebraic root is one geometric intersection. No shape is emitted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Intersect a Euclidean unit normal with a compactified bitangent conic family. The barycentric point and normal use the endpoint tangent triangle; normal
 * @evidence contracts/development/design.md#principled-representation Intersect a Euclidean unit normal with a compactified bitangent conic family. The barycentric point and normal use the endpoint tangent triangle; normal
 * @evidence contracts/development/design.md#minimal-and-owned-surface GhoshConicApproximationDisplacement share IAutoMovieGhoshConicApproximationDisplacement's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieGhoshConicApproximationDisplacement {
  /**
   * Intersect a Euclidean unit normal with a compactified bitangent conic family. The barycentric point and normal use the endpoint tangent triangle; normal coordinates have inverse-millimetre units. For rho=w/(1+w), the implicit conic is (1-rho)^2*l1^2-4*rho^2*l0*l2=0. At rho=1 this is the union of the triangle's two tangent edges, used only as a boundary search limit. A finite normal displacement is returned only for a unique intersection in the positive tangent triangle. Two distinct valid roots remain unsupported; a double algebraic root is one geometric intersection. No shape is emitted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Intersect a Euclidean unit normal with a compactified bitangent conic family. The barycentric point and normal use the endpoint tangent triangle; normal
   * @evidence contracts/development/design.md#principled-representation Intersect a Euclidean unit normal with a compactified bitangent conic family. The barycentric point and normal use the endpoint tangent triangle; normal
   * @evidence contracts/development/design.md#minimal-and-owned-surface GhoshConicApproximationDisplacement share IAutoMovieGhoshConicApproximationDisplacement's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Operation = (
    coordinate: {
      /** Dimensionless barycentric source-point coordinates in the endpoint tangent triangle. */
      value: readonly number[];
      /** Source unit-normal coordinates in the endpoint tangent triangle, with inverse-millimetre units. */
      normal: readonly number[];
    },
    rho: number,
  ) => number | undefined;
}
