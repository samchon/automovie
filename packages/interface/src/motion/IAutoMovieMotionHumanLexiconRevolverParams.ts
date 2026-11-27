import type { IAutoMovieMotionHumanOperate } from "./IAutoMovieMotionHumanOperate";

/**
 * Open parameters of the revolver lexicon family, keyed by each runtime export
 * name: a revolver's handling.
 */
export interface IAutoMovieMotionHumanLexiconRevolverParams {
  /** Cock the hammer with the thumb. */
  cock: IAutoMovieMotionHumanOperate.IParams;

  /** Fan the hammer with the other palm. */
  fanHammer: IAutoMovieMotionHumanOperate.IParams;

  /** Open the loading gate. */
  openGate: IAutoMovieMotionHumanOperate.IParams;

  /** Load a cartridge into the chamber at the gate. */
  loadChamber: IAutoMovieMotionHumanOperate.IParams;

  /** Close the loading gate. */
  closeGate: IAutoMovieMotionHumanOperate.IParams;
}
