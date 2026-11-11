import type { AutoMovieGuidePass } from "@automovie/interface";
import type { IAutoMovieDrawPage } from "@automovie/render";

import type { IAutoMovieHeadlessFrameWriter } from "./IAutoMovieHeadlessFrameWriter";

/**
 * Input of `createHeadlessCaptureAdapter`: the page to drive, the production's draw-only page, the film, the guide passes, and where frames go.
 *
 * @evidence contracts/development/design.md#principled-representation Each option is a value the adapter forwards to the draw session or uses to name files; the page is the render package's structural page.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One flat options record carries the whole session configuration; `passes` alone has a default, applied by the adapter.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No selector or hook name exists, because the draw-only page has no interface and one draw function.
 * @evidence contracts/development/common.md#meaningful-documentation Each member says what it controls, and `passes` its default, folding, ordering, file naming and return path.
 */
export interface IAutoMovieHeadlessCaptureOptions {
  /** The page to drive; the session owns it once creation succeeds. */
  page: IAutoMovieDrawPage;

  /** Address of the production's draw-only page, `render/index.html` of its server. */
  url: string;

  /** Name of the film to draw, as the film registry names it. */
  subject: string;

  /** How the browser draws, such as `swiftshader; Chromium 151.0.7922.34`. */
  backend: string;

  /**
   * Guide passes to capture for every frame, `["beauty"]` by default.
   *
   * Repeated names fold to their first position and the list must not be empty. Each frame is drawn once per pass, in order, and written to `guidePassFrameName(index, pass)`: `beauty` keeps the plain `frame_00042.png` and other passes insert their name, as `frame_00042.depth.png`. Every pass is drawn at the film's delivery raster.
   */
  passes?: readonly AutoMovieGuidePass[];

  /** Persists each drawn PNG; see `IAutoMovieHeadlessFrameWriter`. */
  writeFrame: IAutoMovieHeadlessFrameWriter;
}
