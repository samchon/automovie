import type { IAutoMovieFormationSlot } from "@automovie/interface";

import type { IChunkObject } from "./IChunkObject";

/*
 * One member a per-member cue names, found once at build rather than per frame.
 *
 * Authored sparse members are located once during construction; later updates
 * visit the captured exceptions. A named slot absent from the anonymous chunks,
 * including a promoted hero or an out-of-range index, has no anonymous instance
 * to write and contributes no exception. The host owns promoted heroes; this
 * record does not establish complete upstream cue admission.
 */
export interface ISlotException {
  /*
   * Zero-based slot inside the whole formation.
   */
  slot: number;

  /*
   * The chunk whose instance buffers hold this member.
   */
  chunk: IChunkObject;

  /*
   * This member's index inside that chunk's anonymous slots.
   */
  index: number;

  /*
   * This member's designed placement, kept so it can be re-derived cheaply.
   */
  designed: IAutoMovieFormationSlot;
}
