/**
 * Intersect a Euclidean unit normal with a compactified bitangent conic family.
 * The barycentric point and normal use the endpoint tangent triangle; normal
 * coordinates have inverse-millimetre units. For rho=w/(1+w), the implicit
 * conic is (1-rho)^2_l1^2-4_rho^2_l0_l2=0. At rho=1 this is the union of the
 * triangle's two tangent edges, used only as a boundary search limit. A finite
 * normal displacement is returned only for a unique intersection in the
 * positive tangent triangle. Two distinct valid roots remain unsupported; a
 * double algebraic root is one geometric intersection. No shape is emitted.
 */

export namespace IAutoMovieGhoshConicApproximationDisplacement {
  /**
   * Intersect a Euclidean unit normal with a compactified bitangent conic
   * family. The barycentric point and normal use the endpoint tangent triangle;
   * normal coordinates have inverse-millimetre units. For rho=w/(1+w), the
   * implicit conic is (1-rho)^2_l1^2-4_rho^2_l0_l2=0. At rho=1 this is the
   * union of the triangle's two tangent edges, used only as a boundary search
   * limit. A finite normal displacement is returned only for a unique
   * intersection in the positive tangent triangle. Two distinct valid roots
   * remain unsupported; a double algebraic root is one geometric intersection.
   * No shape is emitted.
   */

  export type Operation = (
    coordinate: {
      /**
       * Dimensionless barycentric source-point coordinates in the endpoint
       * tangent triangle.
       */
      value: readonly number[];
      /**
       * Source unit-normal coordinates in the endpoint tangent triangle, with
       * inverse-millimetre units.
       */
      normal: readonly number[];
    },
    rho: number,
  ) => number | undefined;
}
