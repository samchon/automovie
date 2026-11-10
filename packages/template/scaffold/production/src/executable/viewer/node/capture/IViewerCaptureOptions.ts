import type { AutoMovieGuidePass } from "@automovie/interface";

import type { AutoMovieHeadlessWaitUntil } from "./AutoMovieHeadlessWaitUntil.js";
import type { IAutoMovieHeadlessPage } from "./IAutoMovieHeadlessPage.js";

/**
 * A caller-owned page and its published capture hooks. Passes are a nonempty, validated, deduplicated list supplied by the output planner. Defaults match the shipped viewer: #view, #clips, __afSeek, __afPass and load.
 *
 * @evidence contracts/development/design.md#principled-representation Structural page methods accept real browser drivers while the caller owns pass admission.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This input contains only page transport options, without Render schedules or output paths.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Defaults describe public viewer hooks and every selector/hook can be overridden.
 * @evidence contracts/development/common.md#meaningful-documentation States pass premises, defaults and the meaning of null hiding.
 */
export interface IViewerCaptureOptions {
  /** Transfers to the session only after successful creation. */
  page: IAutoMovieHeadlessPage;

  /** Fully resolved URL, navigated once unchanged. */
  url: string;

  /** Admitted capture modes in write order; never empty. */
  passes: readonly AutoMovieGuidePass[];

  /** Screenshot element selector; defaults to #view. */
  viewSelector?: string;

  /** Controls hidden once at creation; null preserves controls. Defaults to #clips. */
  hideSelector?: string | null;

  /** Page function called with each sample; defaults to __afSeek. Capture awaits its completion, including a returned promise, and discards its fulfilled value inside the page. */
  seekFunction?: string;

  /** Page function selecting each pass; defaults to __afPass. Capture awaits its completion, including a returned promise, and discards its fulfilled value inside the page. */
  passFunction?: string;

  /** Browser navigation milestone; defaults to load. */
  waitUntil?: AutoMovieHeadlessWaitUntil;
}
