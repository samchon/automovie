/**
 * The index range one assembly member occupies in the merged mesh.
 *
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Retains group membership after buffers are merged.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Maps each individual member to its merged triangle span.
 */
export interface IAutoMovieMeshGroup {
  /**
   * The contributing {@link IAutoMovieMeshPart.id}.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Names the member represented by this merged span.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Preserves the contributor's identity in the merged result.
   */
  id: string;
  /**
   * First index of the member's triangles inside the merged index array.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Keeps the member's geometry addressable within the group.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Defines where this individual's contribution begins.
   */
  start: number;
  /**
   * How many indices the member contributes; always a multiple of three.
   *
   * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group Bounds the member's addressable contribution to the group.
   * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality Defines the exact span owned by this individual.
   */
  count: number;
}
