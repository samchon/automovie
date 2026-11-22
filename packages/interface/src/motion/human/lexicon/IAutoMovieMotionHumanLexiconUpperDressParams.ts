import type { IAutoMovieMotionHumanTipHat } from "../dressing/IAutoMovieMotionHumanTipHat";
import type { IAutoMovieMotionHumanWardrobe } from "../dressing/IAutoMovieMotionHumanWardrobe";
import type { IAutoMovieMotionHumanButton } from "../handling/IAutoMovieMotionHumanButton";
import type { IAutoMovieMotionHumanZip } from "../handling/IAutoMovieMotionHumanZip";
import type { IAutoMovieMotionHumanDress } from "../next/IAutoMovieMotionHumanDress";

/**
 * Open parameters of the upperDress lexicon family, keyed by each runtime export name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The upperDress family is a closed export-name map. Each key uses the law contract directly or projects its open parameters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the upperDress row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
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

  /** Dress oneself with a staged garment: a jacket on, a sleeve, the zip or footwear. */
  wardrobe: IAutoMovieMotionHumanWardrobe;
}
