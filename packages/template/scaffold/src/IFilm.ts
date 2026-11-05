import type { IFilmProduction } from "./IFilmProduction";

/**
 * One deliverable video: its running time and the scene it plays.
 *
 * A production registers one film per screenplay file in `src/films/index.ts`,
 * under that file's name; the Viewer and the render each play one of them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment states what a film is, where films are registered and that each Viewer or render plays one; each member states its unit or lifetime.
 * @evidence contracts/development/design.md#principled-representation A film is the unit the Viewer mounts and the render exports, so it holds exactly the running time both need and a factory that builds a fresh scene per mount; seconds are the shared timebase.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read by the Viewer entry, the render configuration and the seek clamp; the scene contents belong to the film's shots.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member names a particular film, shot or scene.
 */
export interface IFilm {
  /** Running time in seconds; a whole number of frames at the render frame rate. */
  durationSeconds: number;

  /**
   * Builds the film's scene and exact-time performance for one Viewer mount.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that each call builds a fresh scene for one mount.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the film that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the film that implements it answers.
   */
  create(): IFilmProduction;
}
