import type { IAutoMovieDrawPage } from "@automovie/render";
import type { IAutoMovieCliChromiumLaunchOptions } from "./IAutoMovieCliChromiumLaunchOptions";

/**
 * The part of `playwright-core`'s `chromium` the capture host calls, declared
 * structurally so the command loads the production's own Playwright at run time
 * and a test passes a double.
 */
export interface IAutoMovieCliChromium {
  /**
   * Start a headless browser with the given switches, from `executablePath`
   * when given.
   */
  launch(
    options: IAutoMovieCliChromiumLaunchOptions,
  ): Promise<IAutoMovieCliChromium.IBrowser>;
}
export namespace IAutoMovieCliChromium {
  /** A launched browser: its version, its pages, and its end. */
  export interface IBrowser {
    /** The browser's version, such as `131.0.6778.33`. */
    version(): string;

    /** Open a fresh page. */
    newPage(): Promise<
      IAutoMovieDrawPage & {
        /**
         * Optional browser diagnostics; portable draw-only drivers need not
         * emit browser events.
         */
        on?: {
          (event: "pageerror", listener: (error: Error) => void): unknown;
          (
            event: "console",
            listener: (message: { type(): string; text(): string }) => void,
          ): unknown;
        };
      }
    >;

    /** End the browser and every page it holds. */
    close(): Promise<void>;
  }
}
