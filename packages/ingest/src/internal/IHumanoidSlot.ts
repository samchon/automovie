import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * One normalized humanoid slot referencing an inspected glTF node index.
 *
 * @evidence contracts/common.md#principled-implementation The semantic slot union and zero-based node index join metadata conventions to the same admitted node inventory.
 * @evidence contracts/common.md#clear-and-simple-design One compact relation is shared by glTF name mapping and explicit VRM declarations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A slot declaration does not establish positive skin weight; the separate coverage pass supplies that fact.
 * @evidence contracts/common.md#meaningful-documentation Member comments identify normalized semantic meaning and index provenance, excluding weight certification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Slot-reference typing executes no name resolution, metadata traversal or weight scanning.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This relation stores no computed skinning result or cross-document mapping cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record retains two scalar references and owns no rig buffers or resource handles.
 */
export interface IHumanoidSlot {
  /** Normalized humanoid semantic slot declared or resolved by the current profile. */
  bone: AutoMovieHumanoidBone;

  /** Zero-based node index admitted against the current source document inventory. */
  node: number;
}
