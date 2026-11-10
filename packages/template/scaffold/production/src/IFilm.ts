import type { IFilmProduction } from "./IFilmProduction";

/**
 * One deliverable video: its running time and the scene it plays.
 *
 * A production registers one film per screenplay file in
 * `src/composition/films/index.ts`, under that file's name; the Viewer and the
 * render each play one of them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment states what a film is, where films are registered and that each Viewer or render plays one; each member states its unit or lifetime.
 * @evidence contracts/development/design.md#principled-representation A film is the unit the Viewer mounts and the render exports, so it holds exactly the running time both need and an asynchronous factory that prepares a fresh scene per mount, because real films load assets, measure contacts and decode sound before their first frame; seconds are the shared timebase.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Running time, frame rate, an optional delivery raster and the factory, read by the Viewer entry, the render and capture commands and the seek clamp; the scene contents belong to the film's scenes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member names a particular film, shot or scene.
 */
export interface IFilm {
  /** Running time in seconds; a whole number of frames at `fps`. */
  durationSeconds: number;

  /** Frames per second of the film's grid, shared by playback, stills and export. */
  fps: number;

  /** Delivery raster width in pixels, such as 720 for a vertical short; 1280 when absent. */
  width?: number;

  /** Delivery raster height in pixels, such as 1280 for a vertical short; 720 when absent. */
  height?: number;

  /**
   * Prepares the film's scene and exact-time performance for one Viewer mount,
   * reporting progress messages while it loads, measures or decodes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that each call prepares a fresh scene for one mount and what the progress callback receives.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the film that implements it answers.
   */
  create(progress?: (message: string) => void): Promise<IFilmProduction>;
}
