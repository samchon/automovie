import type { IFilmProduction } from "./IFilmProduction";

/**
 * One deliverable video: its running time and the scene it plays.
 *
 * Films are registered in `src/films/index.ts` under their screenplay file's
 * name; the Viewer and the render each play one of them.
 *
 * @evidence contracts/common.md#implementation-and-ownership A film owns its running time and an asynchronous factory that prepares a fresh scene, measured contacts and decoded sound per mount; the Viewer entry owns display and transport, and the render owns capture.
 * @evidence contracts/common.md#authoring-interface Seconds are the shared timebase; create resolves only after preparation completes and reports progress messages through the optional callback.
 */
export interface IFilm {
  /** Running time in seconds; a whole number of frames at `fps`. */
  durationSeconds: number;

  /** Frames per second of the film's grid, shared by playback, stills and export. */
  fps: number;

  /**
   * Prepares the film's scene, performance and soundtrack for one Viewer mount,
   * reporting progress messages while it measures and decodes.
   *
   * @evidence contracts/common.md#implementation-and-ownership The film that implements it owns the preparation; the Viewer entry awaits it once per mount.
   * @evidence contracts/common.md#authoring-interface Resolves the prepared production after measurement and decoding; the optional callback receives progress messages.
   */
  create(progress?: (message: string) => void): Promise<IFilmProduction>;
}
