/**
 * Runtime agreement between a semantic palette and the scene actually drawn.
 *
 * @evidence contracts/common.md#principled-implementation Viewer mask resolution compares declared drawable ids with current built mesh/instance identities, reporting unresolved declared ids and the count of built meshes with no palette address.
 * @evidence contracts/common.md#clear-and-simple-design Two directional gap fields distinguish missing expected drawables from unexpected actual meshes without pretending palette validity alone proves runtime coverage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither gap is normalized away or painted as successful background evidence; complete coverage requires both populations to be empty.
 * @evidence contracts/common.md#meaningful-documentation Defines expected-but-unresolved ids and actual-unaddressed mesh count from the same built scene.
 * @author Samchon
 */
export interface IAutoMovieSemanticMaskCoverage {
  /** Declared drawable ids absent from the built scene, in ascending order. */
  unresolved: string[];

  /** Built meshes that the palette could not name. */
  unaddressed: number;
}
