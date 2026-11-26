import { findAutoMovieFreePort } from "./internal/findAutoMovieFreePort";

/** Public page-serving operations for the CLI. */
export namespace AutoMovieCliPage {
  /**
   * Find a port the operating system reports free on 127.0.0.1 at the moment
   * of asking. The server listens with strictPort, so a race fails at startup.
   */
  export function findFreePort(): Promise<number> {
    return findAutoMovieFreePort();
  }
}