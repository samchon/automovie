/**
 * The index range one assembly member occupies in a merged mesh, the material
 * group that lets one draw call still say which triangles belong to which
 * member.
 *
 * @evidence contracts/development/design.md#principled-representation A start and count over the merged index buffer, which is exact because `mergeAutoMovieMeshParts` appends each member's indices, or its implicit sequential indices, as one run.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The same start-and-count shape a renderer's draw group takes, plus the member id, so no translation layer sits between an assembly and its consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No range is rounded or merged across members; each group reports exactly the indices its member contributed.
 * @evidence contracts/development/common.md#meaningful-documentation States which member id it carries, that `start` and `count` address the merged index array, and that `count` is a multiple of three.
 */
export interface IAutoMovieMeshGroup {
  /** The contributing member's `IAutoMovieMeshPart.id`, unique within its assembly. */
  id: string;

  /** First index of the member's triangles inside the merged index array. */
  start: number;

  /** How many indices the member contributes; always a multiple of three. */
  count: number;
}
