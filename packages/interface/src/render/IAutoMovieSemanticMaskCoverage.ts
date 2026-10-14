/**
 * Root and mesh membership agreement between a semantic palette and an assembled scene.
 *
 * @evidence contracts/common.md#principled-implementation Viewer resolution maps staged nodes by initial child order and other roots by name, then reports drawable semantic entries with no root and counts Mesh objects with no nearest claimed ancestor, including hidden meshes. Correct design order, names and palette ownership are producer premises; this is neither per-slot completeness nor submitted-pixel coverage.
 * @evidence contracts/common.md#clear-and-simple-design Two directional gap fields distinguish missing expected drawables from unexpected actual meshes without pretending palette validity alone proves runtime coverage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither gap is normalized away; both must be empty for the coverage classifier to call this complete. A group root can resolve without containing a rendered mesh, individual slot entries need no root, and cached coverage requires renewal after graph changes; zero gaps alone proves no visibility or frame freshness.
 * @evidence contracts/common.md#meaningful-documentation Defines expected-but-unresolved ids and actual-unaddressed mesh count from the same built scene.
 * @author Samchon
 */
export interface IAutoMovieSemanticMaskCoverage {
  /** Semantic entry ids with drawable-node claims or instance-set kind but no resolved object root, in the admitted palette's ascending order. */
  unresolved: string[];

  /** Built Mesh objects with no nearest claimed ancestor, including hidden geometry; a non-negative safe integer. */
  unaddressed: number;
}
