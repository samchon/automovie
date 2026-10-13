/**
 * One eye's lashes on a lash surface: the surface, its upper and lower lash
 * regions, and the vertices this eye owns.
 *
 * @evidence contracts/common.md#principled-implementation Registered upper/lower source regions identify row finish and replacement ownership, while the resident surface and per-eye vertex population identify the original lash component independently of anterior skin roots.
 * @evidence contracts/common.md#clear-and-simple-design Source surface, two material-region IDs and component vertices remain distinct from numerical shaft counts and the canonical LashRoots registration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts buildHumanFaceLashRows refuses missing registered regions and obtains roots from anterior skin, never source card area or vertex count; this component record alone proves no follicle distribution or generated contact success.
 * @evidence contracts/common.md#meaningful-documentation Source region/surface index domains and anatomical component ownership distinguish retained cards from independently generated upper/lower populations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no source clipping or shaft generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared source finish ownership does not implement texture/mesh caching here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The producer owns component indices; this declaration opens no card image or renderer resource.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularLashes {
  /** ID of the basis surface that carries the lashes. */
  surface: string;

  /** ID of the region of that surface drawing the upper lashes. */
  upperRegion: string;

  /** ID of the region of that surface drawing the lower lashes. */
  lowerRegion: string;

  /** Vertex indices of that surface owned by this eye, ascending. */
  vertices: number[];
}
