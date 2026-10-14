/**
 * A named area of a basis's skin, face or body: a set of vertices of one
 * surface.
 *
 * Measurement rules refer to a skin area by name, never by a vertex list,
 * because vertex numbers belong to one basis's topology. A rule that must keep
 * a feature out of a search (the person head breadth keeps `ear-right` and
 * `ear-left` out of its euryon search, `readHumanHeadBreadth`) names the
 * area; the basis states which of its vertices it holds. A
 * rule naming an area the basis does not declare refuses by that name.
 *
 * @evidence contracts/common.md#principled-implementation A surface ordinal and strictly increasing vertex set register a named skin area for measurement selection.
 * @evidence contracts/common.md#clear-and-simple-design The basis owns vertex membership while instruments refer to a stable region name.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Region names avoid copying topology-specific vertex lists into measurement rules.
 * @evidence contracts/common.md#meaningful-documentation The prose explains basis ownership, feature exclusion and undeclared-region refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The named skin region binding has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The named skin region binding schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The named skin region binding declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinRegion {
  /** Index into the basis's surfaces. */
  surface: number;

  /** Vertex indices in that surface, strictly increasing. */
  vertices: number[];
}
