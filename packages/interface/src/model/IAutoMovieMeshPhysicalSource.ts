/**
 * One physical source point that render vertices of a mesh may alias.
 *
 * Equal domain/ID pairs identify one actual point duplicated for attributes
 * such as UV or normal seams; coordinate contact alone never identifies two
 * points. Reusing a pair across placed meshes asserts the same actual point in
 * their shared frame.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Names the source-point identity that distinguishes attribute aliases from coordinate contact.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types one domain/ID lineage entry of the per-vertex physical correspondence.
 * @author Samchon
 */
export interface IAutoMovieMeshPhysicalSource {
  /**
   * Nonblank equivalence context naming an actual physical instance; not a
   * biological-source name or a normal island.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Exposes `domain` as the instance context in which source IDs identify points.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `domain` for the source lineage geometry input.
   */
  domain: string;

  /**
   * Nonnegative safe-integer point identity within `domain`.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Exposes `id` as the point identity shared by attribute aliases.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `id` for the source lineage geometry input.
   */
  id: number;
}
