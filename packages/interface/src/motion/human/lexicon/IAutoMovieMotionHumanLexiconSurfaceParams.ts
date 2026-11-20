import type { IAutoMovieMotionHumanSurface } from "./IAutoMovieMotionHumanSurface";

/**
 * Open inputs for the ice, snow and board laws in the surface lexicon.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row names the surface and stance it uses.
 * @evidence contracts/development/design.md#principled-representation A closed row-name map extended by the sport family.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Maps runtime export names to their respective canonical inputs for schema generation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each member refers to its law's parameter type.
 */
export interface IAutoMovieMotionHumanLexiconSurfaceParams {
  /** Travel over ice, optionally turning or coming to a stop. */
  skate: IAutoMovieMotionHumanSurface.ISkateParams;

  /** Deliver from a low flat-foot slide with trailing forefoot support. */
  curlDelivery: IAutoMovieMotionHumanSurface.ICurlDeliveryParams;

  /** Glide over snow on an authored grade. */
  snowGlide: IAutoMovieMotionHumanSurface.ISnowGlideParams;

  /** Keep a board-relative stance as the board moves. */
  boardRide: IAutoMovieMotionHumanSurface.IBoardRideParams;
}
