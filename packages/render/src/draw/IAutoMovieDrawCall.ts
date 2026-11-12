import type { IAutoMovieInspectionRequest } from "../scene/inspection/IAutoMovieInspectionRequest.js";

/**
 * One picture a host asks a draw page for: the second, the view, the inspection with its pass, the raster, the seconds a fitted view is framed over, and the label scale.
 *
 * `planAutoMovieDrawCall` makes one from a capture cell, and a delivery makes one per frame and pass. It crosses into the page as JSON, so it holds only plain data.
 *
 * @evidence contracts/development/design.md#principled-representation Seconds are the subject's timebase, the raster and label scale are pixels, the view is text of the inspection view grammar and the request the inspection core's own record, whose `shade` is the pass. `frame` lists the seconds a fitted view frames, so one camera serves a whole run and travel reads as travel.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Each member is read by the page's draw function; the request and view grammar are owned by the inspection core.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No subject kind or host is named; that the raster is whole and positive and `frame` holds `seconds` for a fitted view are kept by the producers.
 * @evidence contracts/development/common.md#meaningful-documentation States the producers, the transport, and each member's unit and meaning.
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

  /** Seconds over whose drawn boxes a fitted view is framed, the drawn second among them; ignored by `film`, fixed and subject views. */
  frame: number[];

  /** Font pixel size in picture pixels of the labels the host stamps, which label placement uses to keep labels apart. */
  scale: number;
}
