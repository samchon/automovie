/**
 * The index range one assembly member occupies in a merged mesh, the material
 * group that lets one draw call still say which triangles belong to which
 * member.
 */
export interface IAutoMovieMeshGroup {
  /**
   * The contributing member's `IAutoMovieMeshPart.id`, unique within its
   * assembly.
   */
  id: string;

  /** First index of the member's triangles inside the merged index array. */
  start: number;

  /** How many indices the member contributes; always a multiple of three. */
  count: number;
}
