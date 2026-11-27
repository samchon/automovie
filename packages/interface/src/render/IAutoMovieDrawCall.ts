import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest.js";

/**
 * One picture a host asks a draw page for: the second, the view, the inspection
 * with its pass, the raster, the seconds a fitted view is framed over, and the
 * label scale.
 *
 * `planAutoMovieDrawCall` makes one from a capture cell, and a delivery makes
 * one per frame and pass. It crosses into the page as JSON, so it holds only
 * plain data.
 */
export interface IAutoMovieDrawCall {
  /** The second drawn, in the subject's time. */
  seconds: number;

  /** The view text, read by `parseAutoMovieInspectionView`. */
  view: string;

  /** The inspection the picture is drawn with; its `shade` is the pass. */
  request: IAutoMovieInspectionRequest;

  /** Picture width in pixels. */
  width: number;

  /** Picture height in pixels. */
  height: number;

  /**
   * Seconds over whose drawn boxes a fitted view is framed, the drawn second
   * among them; ignored by `film`, fixed and subject views.
   */
  frame: number[];

  /**
   * Font pixel size in picture pixels of the labels the host stamps, which
   * label placement uses to keep labels apart.
   */
  scale: number;

  /**
   * An ordered delivery sample. The page still reports diagnostics and leaves
   * the delivered picture free of review overlays.
   */
  inspectionDiagnostics?: "delivery";

  /**
   * `transparent` draws the `beauty` pass over a transparent background: the
   * scene's own backdrop is left undrawn, the target is cleared to alpha 0, and
   * the picture comes back with straight alpha, every mesh drawn as the subject
   * built it. A subject with `optics` keeps its camera response, which the film
   * response stage gives to straight colour while alpha passes it unchanged;
   * its glare spreads alpha with light and a medium adds its own opacity, as
   * render's `AutoMovieRenderFilmAlpha` states. A transition's fade falls to alpha 0.
   * Absent draws the opaque picture.
   *
   * The page refuses it for any other pass, whose black background is part of
   * its convention.
   */
  background?: "transparent";
}
