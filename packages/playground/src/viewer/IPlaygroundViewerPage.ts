import type { IPlaygroundViewerApplication } from "./IPlaygroundViewerApplication";

/**
 * The same-origin product bridge a normal application supplies to its host.
 * Actual completion and transfer are separate from source freshness and PNG IO.
 * The host captures application input and the producer-controlled viewport
 * before candidate restoration. Playback suspension stays with the original
 * viewport control, document transactions stay with the registered application,
 * and the page implementation owns listeners and completed-display resources.
 * Failed candidate admission preserves the prior completed page.
 *
 * @author Samchon
 */
export interface IPlaygroundViewerPage {
  /**
   * Register the original typed application loader and state owner.
   * Initial application rejection is reported through the page's failure path.
   */
  register: (application: IPlaygroundViewerApplication) => void;

  /**
   * Capture the original application's displayed input and supported viewport.
   * Each component remains absent when its original owner exposes no value.
   */
  capture: () => unknown;

  /**
   * Preserve an owned playback clock; document transactions retain their owner.
   * Return the producer's release operation, or a no-op when it supplies none.
   */
  freeze: () => () => void;

  /**
   * Actual entry/runtime failure before a candidate can supply a completed view.
   * Terminal failure rejects pending frame admission and reports its cause to
   * the same-origin parent; it does not retire the parent's prior good page.
   */
  fail: (cause: unknown) => void;

  /**
   * Request a same-origin product source selection without retiring the live editor.
   * The parent owns destination admission and replacement after restoration.
   */
  navigate: (address: string) => void;
}
