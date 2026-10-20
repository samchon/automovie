/**
 * The index range one assembly member occupies in a merged mesh, the material
 * group that lets one draw call still say which triangles belong to which
 * member.
 *
 * @evidence contracts/common.md#principled-implementation A start and count over the merged index buffer, which is exact because `mergeAutoMovieMeshParts` appends each member's indices, or its implicit sequential indices, as one run.
 * @evidence contracts/common.md#clear-and-simple-design The same start-and-count shape a renderer's draw group takes, plus the member id, so no translation layer sits between an assembly and its consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No range is rounded or merged across members; each group reports exactly the indices its member contributed.
 * @evidence contracts/common.md#meaningful-documentation States which member id it carries, that `start` and `count` address the merged index array, and that `count` is a multiple of three.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record with no runtime body; the merge computes each range in one pass over the members.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh record per member per merge; nothing is cached.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three scalar fields and no reference to the member's buffers.
 */
export interface IAutoMovieMeshGroup {
  /** The contributing member's `IAutoMovieMeshPart.id`, unique within its assembly. */
  id: string;

  /** First index of the member's triangles inside the merged index array. */
  start: number;

  /** How many indices the member contributes; always a multiple of three. */
  count: number;
}
