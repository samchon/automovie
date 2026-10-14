import type { IControlMesh } from "../../mesh/structures/IControlMesh";

/**
 * A component's reserved region replaced after the host has refined its skin. The append operation receives the actual oriented boundary and preserves its resident vertex identities. It adds source geometry and its joining faces; it does not move or remove surviving host vertices or unrelated faces. An appender also extends any resident reference/RGB attributes in the same vertex order. The head assembler pairs current and reference appenders.
 *
 * @evidence contracts/common.md#principled-implementation A reserved face-group label survives subdivision so the coordinator resolves its original refined boundary before removing the group once and appending source geometry.
 * @evidence contracts/common.md#clear-and-simple-design The group identifies removal ownership and append owns geometry; common boundary ordering and current/reference pairing remain assembler responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserving surviving IDs and aligned attributes is a producer contract; the coordinator checks alignment but does not prove patch manifoldness or clinical fit.
 * @evidence contracts/common.md#meaningful-documentation Members identify the reserved group and an owned millimetre cage against a fixed resident boundary, including reference/RGB extension requirements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The replacement description performs no group scan or patch construction; the appender and coordinator separately own that work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reserved group identity is not a patch-result cache or cross-build boundary equivalence policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type allocates no cage or boundary arrays; actual callback state lives with the fitted plan and head build.
 * @author Samchon
 */
export interface IPortraitRegionReplacement {
  /** Unique reserved face-region label, inherited through host subdivision. */
  group: number;

  /**
   * Append owned millimetre geometry against the fixed refined host boundary. Preserve surviving host rows/IDs and extend any reference/colour rows in matching vertex order. The callback may fail; its partial cage is not returned.
   *
   * @evidence contracts/common.md#principled-implementation Explicit boundary IDs anchor source geometry to the owned refined cage without moving or re-identifying surviving host vertices.
   * @evidence contracts/common.md#clear-and-simple-design The appender owns one component patch; removal, directed boundary ordering and attribute-count admission stay with the coordinator.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback must preserve unrelated topology and resident attributes, with no synthetic replacement for a missing boundary; this signature supplies no automatic global topology proof.
   * @evidence contracts/common.md#meaningful-documentation Prose specifies mutable owned millimetre cage, borrowed fixed boundary IDs, aligned attributes and failure without a returned partial mesh.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This append declaration builds no patch; actual component appenders and boundary/removal coordinators own their geometry work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The callback signature implements no boundary or current/reference patch cache; the assembler owns distinct geometry invocation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This signature acquires no patch buffers or retained producer state; its implementation transfers geometry into the owned cage.
   */
  append: (cage: IControlMesh, boundary: readonly number[]) => void;
}
