import type { IAutoMovieFormationSlot } from "@automovie/interface";
import type { IChunkObject } from "./IChunkObject.js";

/**
 * One member a per-member cue names, found once at build rather than per frame.
 *
 * The channel is sparse and its whole promise is that a crowd does not pay for
 * it, so the members it singles out are located once and the per-frame work is
 * proportional to how many there are. A slot named but not found here ??a
 * promoted hero, or an index outside the unit ??simply has no instance to
 * write, which is what the builder gate already refuses at compile time.
 *
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Describes one sparse member override resolved against existing chunk buffers.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Describes one sparse member override resolved against existing chunk buffers.
 * @author Samchon
 */
export interface ISlotException {
  /** Zero-based slot inside the whole formation.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Identifies the singled-out logical member without renumbering the formation.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Identifies the singled-out logical member without renumbering the formation.
   */
  slot: number;

  /** The chunk whose instance buffers hold this member.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Identifies the resident chunk whose tier buffers contain this sparse exception.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Identifies the resident chunk whose tier buffers contain this sparse exception.
   */
  chunk: IChunkObject;

  /** This member's index inside that chunk's anonymous slots.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Locates the member inside each tier buffer without moving any later instance.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Locates the member inside each tier buffer without moving any later instance.
   */
  index: number;

  /** This member's designed placement, kept so it can be re-derived cheaply.
   *
   * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-policy-selection Retains the original compiled placement from which each frame derives the sparse override.
   * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-compact-representation-compatibility Retains the original compiled placement from which each frame derives the sparse override.
   */
  designed: IAutoMovieFormationSlot;
}

