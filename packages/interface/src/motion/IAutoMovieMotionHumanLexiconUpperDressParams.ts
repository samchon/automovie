import type { IAutoMovieMotionHumanTipHat } from "./IAutoMovieMotionHumanTipHat";
import type { IAutoMovieMotionHumanWardrobe } from "./IAutoMovieMotionHumanWardrobe";
import type { IAutoMovieMotionHumanButton } from "./IAutoMovieMotionHumanButton";
import type { IAutoMovieMotionHumanZip } from "./IAutoMovieMotionHumanZip";
import type { IAutoMovieMotionHumanDress } from "./IAutoMovieMotionHumanDress";

/**
 * Open parameters of the upperDress lexicon family, keyed by each runtime
 * export name.
 */
export interface IAutoMovieMotionHumanLexiconUpperDressParams {
  /** `dress` putting on a `hat`. */
  dressHat: Omit<IAutoMovieMotionHumanDress.IParams, "item">;

  /** `dress` putting on a `glasses`. */
  dressGlasses: Omit<IAutoMovieMotionHumanDress.IParams, "item">;

  /** Tip a worn hat in greeting. */
  tipHat: IAutoMovieMotionHumanTipHat;

  /** Move a garment button through its opening. */
  button: IAutoMovieMotionHumanButton;

  /** Draw a zipper slider along its track. */
  zip: IAutoMovieMotionHumanZip;

  /**
   * Dress oneself with a staged garment: a jacket on, a sleeve, the zip or
   * footwear.
   */
  wardrobe: IAutoMovieMotionHumanWardrobe;
}
