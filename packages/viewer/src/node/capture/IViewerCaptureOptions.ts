import type { AutoMovieGuidePass } from "@automovie/interface";

import type { AutoMovieHeadlessWaitUntil } from "./AutoMovieHeadlessWaitUntil.js";
import type { IAutoMovieHeadlessPage } from "./IAutoMovieHeadlessPage.js";

/**
 * A caller-owned page and its published capture hooks. Passes are a nonempty, validated, deduplicated list supplied by the output planner. Defaults match the shipped viewer: #view, #clips, __afSeek, __afPass and load.
 *
 * @evidence contracts/common.md#principled-implementation Structural page methods accept real browser drivers while the caller owns pass admission.
 * @evidence contracts/common.md#clear-and-simple-design This input contains only page transport options, without Render schedules or output paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Defaults describe public viewer hooks and every selector/hook can be overridden.
 * @evidence contracts/common.md#meaningful-documentation States pass premises, defaults and the meaning of null hiding.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased input record chooses no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The factory owns reuse, not this record.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns page until creation resolves; the returned session then owns release.
 * @author Samchon
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

  /** Page function called with each sample; defaults to __afSeek. */
  seekFunction?: string;

  /** Page function selecting each pass; defaults to __afPass. */
  passFunction?: string;

  /** Browser navigation milestone; defaults to load. */
  waitUntil?: AutoMovieHeadlessWaitUntil;
}
