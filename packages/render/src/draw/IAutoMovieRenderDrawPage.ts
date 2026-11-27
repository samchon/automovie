import type {
  IAutoMovieDrawDescription,
  IAutoMovieDrawResult,
} from "@automovie/interface";

import type { IAutoMovieRenderDrawPageRequest } from "./IAutoMovieRenderDrawPageRequest.js";

/**
 * The browser page a draw session drives, declared as the five Playwright
 * `Page` methods it calls, so a Playwright page fits as it is and a test passes
 * a recording double.
 *
 * Functions handed to `waitForFunction` and `evaluate` run inside the page, so
 * they read only their argument; the init script is text.
 */
export interface IAutoMovieRenderDrawPage {
  /**
   * Run a script's text in the page before any of its own scripts, on every
   * load. The text form is the one Playwright's `Page.addInitScript` takes
   * without serialising an argument, so a real page fits without a cast.
   */
  addInitScript(script: { content: string }): Promise<unknown>;

  /**
   * Load an address and wait for its `load` event within the given
   * milliseconds.
   */
  goto(
    url: string,
    options: { waitUntil: "load"; timeout?: number },
  ): Promise<unknown>;

  /**
   * Resolve once `predicate(arg)`, run in the page, is truthy; reject after
   * `options.timeout` milliseconds.
   */
  waitForFunction<T>(
    predicate: (arg: T) => unknown,
    arg: T,
    options: { timeout: number },
  ): Promise<unknown>;

  /**
   * Run `task(arg)` in the page and resolve with its JSON result, awaiting a
   * returned promise; a throw in the page rejects with its message. The
   * argument is one of the session's typed requests, each with its answer.
   */
  evaluate(
    task: (
      arg: IAutoMovieRenderDrawPageRequest.IDescribe,
    ) => Promise<IAutoMovieDrawDescription>,
    arg: IAutoMovieRenderDrawPageRequest.IDescribe,
  ): Promise<IAutoMovieDrawDescription>;
  evaluate(
    task: (arg: IAutoMovieRenderDrawPageRequest.ISpeak) => Promise<void>,
    arg: IAutoMovieRenderDrawPageRequest.ISpeak,
  ): Promise<void>;
  evaluate(
    task: (
      arg: IAutoMovieRenderDrawPageRequest.IDraw,
    ) => Promise<IAutoMovieDrawResult>,
    arg: IAutoMovieRenderDrawPageRequest.IDraw,
  ): Promise<IAutoMovieDrawResult>;

  /** Close the page. */
  close(): Promise<unknown>;
}
