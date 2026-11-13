import type { IPlaygroundComposition } from "./structures/IPlaygroundComposition";
import type { IPlaygroundRefusal } from "./structures/IPlaygroundRefusal";
import type { IPlaygroundTimeline } from "./structures/IPlaygroundTimeline";
import type { IPlaygroundVerdicts } from "./structures/IPlaygroundVerdicts";
import type { IPlaygroundVocabulary } from "./structures/IPlaygroundVocabulary";

/**
 * The one boundary between the playground page and the AutoMovie packages.
 *
 * The page imports no `@automovie/*` package. It asks an adapter for the
 * lists its pickers show, hands it a composition, and reads back either a
 * performance or the reason there is none. `PlaygroundPackageAdapter` answers
 * from the installed packages.
 *
 * Every call is asynchronous, so an implementation may move the work to a
 * worker without changing the page.
 */
export interface IPlaygroundAdapter {
  /**
   * List what the editor's pickers offer.
   *
   * @returns The vocabulary.
   */
  describe(): Promise<IPlaygroundVocabulary>;

  /**
   * Build the performance of a composition.
   *
   * @param composition The composition.
   * @returns The performance, or why the composition was refused. Never rejects for a refused composition.
   */
  perform(
    composition: IPlaygroundComposition,
  ): Promise<IPlaygroundAdapter.Result>;
}
export namespace IPlaygroundAdapter {
  /** What `perform` gives. */
  export type Result =
    | {
        /** The composition plans. */
        kind: "performance";

        /** Its performance. */
        performance: IPerformance;
      }
    | {
        /** The composition was refused or failed. */
        kind: "refusal";

        /** Why. */
        refusal: IPlaygroundRefusal;
      };

  /** A built performance. */
  export interface IPerformance {
    /** The actions and their instants on the film clock. */
    timeline: IPlaygroundTimeline;

    /**
     * Draw the performance into an element and keep drawing it until
     * unmounted. The drawing owns the address's query; the fragment is left
     * alone.
     *
     * @param root The element to draw into.
     * @returns What ends the drawing and releases its resources.
     */
    mount(root: HTMLElement): IMounted;

    /**
     * Read every physical bound on the performance. This samples the whole
     * film and can take from seconds to minutes.
     *
     * @returns The report.
     */
    verdicts(): Promise<IPlaygroundVerdicts>;
  }

  /** A mounted drawing. */
  export interface IMounted {
    /** End the drawing and release what it holds. */
    unmount(): void;
  }
}
