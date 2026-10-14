/**
 * A part carried by some vertices of a basis surface, such as one brow on a
 * surface that holds both.
 *
 * @evidence contracts/common.md#principled-implementation A source surface and its registered component vertices let brow instruments select actual posed card points/triangles of one side instead of measuring the entire shared surface.
 * @evidence contracts/common.md#clear-and-simple-design Component ownership is a surface/index subset, while the containing periocular side gives its anatomical role.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record supplies source correspondence rather than per-person vertex controls; missing/empty instrument support yields unavailable observations, and a component subset alone proves no biological tissue boundary.
 * @evidence contracts/common.md#meaningful-documentation Resident surface indices and ascending source-owned population distinguish component identity from detached world coordinates or material render indices.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema performs no triangle selection or brow measurement.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared source membership is data, not a posed-surface cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The source owner holds the index list; no mesh/query resource is acquired here.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularComponent {
  /** ID of the basis surface that carries the part. */
  surface: string;

  /** Vertex indices of that surface owned by the part, ascending. */
  vertices: number[];
}
