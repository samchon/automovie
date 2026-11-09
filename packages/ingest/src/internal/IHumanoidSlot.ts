import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * One normalized humanoid slot referencing an inspected glTF node index.
 *
 * @evidence contracts/development/design.md#principled-representation The semantic slot union and zero-based node index join metadata conventions to the same admitted node inventory.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One compact relation is shared by glTF name mapping and explicit VRM declarations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A slot declaration does not establish positive skin weight; the separate coverage pass supplies that fact.
 * @evidence contracts/development/common.md#meaningful-documentation Member comments identify normalized semantic meaning and index provenance, excluding weight certification.
 */
export interface IHumanoidSlot {
  /** Normalized humanoid semantic slot declared or resolved by the current profile. */
  bone: AutoMovieHumanoidBone;

  /** Zero-based node index admitted against the current source document inventory. */
  node: number;
}
