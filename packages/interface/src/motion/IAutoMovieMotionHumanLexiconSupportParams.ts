import type { IAutoMovieMotionHumanSupport } from "./IAutoMovieMotionHumanSupport";
import type { IAutoMovieMotionHumanAidWalk } from "./IAutoMovieMotionHumanAidWalk";
import type { IAutoMovieMotionHumanAssistedTransfer } from "./IAutoMovieMotionHumanAssistedTransfer";

/**
 * Open parameters of the support lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconSupportParams {
  /**
   * Scramble up onto a ledge: the palms on its top, a knee up onto its edge,
   * the other foot up, standing on it.
   */
  scramble: IAutoMovieMotionHumanSupport.IRow;

  /**
   * Slide off a table's edge: seated upright on it with the hands beside the
   * seat, the feet down to the floor, standing.
   */
  slideOff: IAutoMovieMotionHumanSupport.IRow;

  /** Walk leaning on a held aid, a cane or a walker (`aidWalk`). */
  HumanAidWalk: IAutoMovieMotionHumanAidWalk;

  /**
   * Move a helped person from one seat to another, a helper's arms bearing them
   * (`assistedTransfer`).
   */
  HumanAssistedTransfer: IAutoMovieMotionHumanAssistedTransfer.IRoleParams;
}
