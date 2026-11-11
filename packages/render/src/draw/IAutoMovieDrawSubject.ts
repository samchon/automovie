import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";

/**
 * One subject a draw page offers: something that prepares a fresh scene to draw.
 *
 * A subject module offers its subjects by name through `AutoMovieDrawSubjects`, and the page's draw function creates the one the host names once, when it is first described or drawn.
 *
 * @evidence contracts/development/design.md#principled-representation Preparing a subject is asynchronous because real subjects load assets, measure contacts or decode sound before their first picture, so the subject is a factory, not a scene.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One member, read by `installAutoMovieDraw`; a production's film registry and a motion case both map onto it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member names a subject kind; what the subject is lives in its scene.
 * @evidence contracts/development/common.md#meaningful-documentation States who offers it, who calls it and when.
 */
export interface IAutoMovieDrawSubject {
  /**
   * Prepare the subject's scene for one page.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that each call prepares a fresh scene for one page.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the subject that implements it answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the subject that implements it answers.
   */
  create(): Promise<IAutoMovieDrawScene>;
}
