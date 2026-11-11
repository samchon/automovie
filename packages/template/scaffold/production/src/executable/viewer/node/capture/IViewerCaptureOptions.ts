import type { AutoMovieGuidePass } from "@automovie/interface";
import type { IAutoMovieDrawPage } from "@automovie/render";

/**
 * A caller-owned page, the production's draw-only page to load in it, the film to draw and the passes of every frame. Passes are a nonempty, validated, deduplicated list supplied by the output planner.
 *
 * @evidence contracts/development/design.md#principled-representation The draw-only page is reached through the render package's structural page, so a Playwright page fits unchanged; the film is named as the page's subject.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only page transport inputs, without render schedules or output paths; no selector or hook name exists, because the page has no interface and one draw function.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member names a particular film.
 * @evidence contracts/development/common.md#meaningful-documentation States pass premises, ownership and what each member names.
 */
export interface IViewerCaptureOptions {
  /** Transfers to the session only after successful creation. */
  page: IAutoMovieDrawPage;

  /** Address of the production's draw-only page, `render/index.html` of its server. */
  url: string;

  /** Name of the film to draw, as the film registry names it. */
  subject: string;

  /** How the browser draws, recorded with each frame's renderer, such as `swiftshader; Chromium 151.0.7922.34`. */
  backend: string;

  /** Admitted capture modes in write order; never empty. */
  passes: readonly AutoMovieGuidePass[];

  /** Milliseconds one page call may take; 240000 by default. */
  timeout?: number;
}
