/** Headless Chromium options passed to the production's Playwright instance. */
export interface IAutoMovieCliChromiumLaunchOptions {
  /** Run Chromium without a visible window. */
  headless: true;

  /** Switches selected for the requested capture backend. */
  args: string[];

  /** Executable path when the backend selects an explicit Chromium binary. */
  executablePath?: string;
}
