/**
 * Root and mesh membership agreement between a semantic palette and an
 * assembled scene.
 */
export interface IAutoMovieSemanticMaskCoverage {
  /**
   * Semantic entry ids with drawable-node claims or instance-set kind but no
   * resolved object root, in the admitted palette's ascending order.
   */
  unresolved: string[];

  /**
   * Built Mesh objects with no nearest claimed ancestor, including hidden
   * geometry; a non-negative safe integer.
   */
  unaddressed: number;
}
