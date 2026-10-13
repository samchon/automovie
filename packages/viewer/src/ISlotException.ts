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
 * @author Samchon
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

