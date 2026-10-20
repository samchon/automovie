import type { IAutoMovieFormationSlot } from "@automovie/interface";

import type { IChunkObject } from "./IChunkObject.js";

/**
 * One member a per-member cue names, found once at build rather than per frame.
 *
 * Authored sparse members are located once during construction; later updates
 * visit the captured exceptions. A named slot absent from the anonymous
 * chunks, including a promoted hero or an out-of-range index, has no anonymous
 * instance to write and contributes no exception. The host owns promoted heroes;
 * this record does not establish complete upstream cue admission.
 *
 * @evidence contracts/common.md#principled-implementation Stores one located compiled formation slot with its owning anonymous chunk, local index and designed placement; sparse cue updates can address exactly that member without allocating a persistent Object3D per crowd member.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the global-to-local slot join beside the cue's original placement, with chunk/tier buffers owned by the surrounding formation runtime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The sparse set comes from authored per-member cues; absent/promoted/nonresident slots yield no exception rather than a fabricated instance or fixture-specific index.
 * @evidence contracts/common.md#meaningful-documentation States global and chunk-local indexing, designed placement and one-time lookup purpose; the builder's compile/runtime admission still determines whether a member can be instanced.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The slot-reference record performs no lookup or per-frame matrix calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The formation builder/update owner performs the one-time join and sparse reuse, not the shape itself.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources References remain owned by the formation's exception collection and acquire no separate GPU allocation or task.
 */
export interface ISlotException {
  /** Zero-based slot inside the whole formation. */
  slot: number;

  /** The chunk whose instance buffers hold this member. */
  chunk: IChunkObject;

  /** This member's index inside that chunk's anonymous slots. */
  index: number;

  /** This member's designed placement, kept so it can be re-derived cheaply. */
  designed: IAutoMovieFormationSlot;
}
