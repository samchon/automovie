/**
 * Runtime agreement between a semantic palette and the scene actually drawn.
 */
export interface IAutoMovieSemanticMaskCoverage {
  /** Declared drawable ids absent from the built scene, in ascending order. */
  unresolved: string[];

  /** Built meshes that the palette could not name. */
  unaddressed: number;
}
