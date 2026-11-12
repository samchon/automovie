import type { IAutoMovieDrawCall } from "./IAutoMovieDrawCall.js";
import type { IAutoMovieDrawDescription } from "./IAutoMovieDrawDescription.js";
import type { IAutoMovieDrawResult } from "./IAutoMovieDrawResult.js";

/**
 * The draw-only function a page installs under `AUTO_MOVIE_DRAW_GLOBALS.draw`, which every host calls to get pictures: describe the subject, then draw one call at a time.
 *
 * `installAutoMovieDraw` provides it; `AutoMovieDrawSession` calls it from Node through the browser driver. Calls must not overlap, because they share one scene and one renderer.
 *
 * @evidence contracts/development/design.md#principled-representation Two calls are what a host needs: what the subject offers, to plan, and one picture per planned call.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly the two members the session calls; the scene, the renderer and the inspection stay inside the page.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member touches the page's interface; the page that holds the function has none.
 * @evidence contracts/development/common.md#meaningful-documentation States who installs and calls it and the no-overlap rule.
 */
export interface IAutoMovieDrawFunction {
  /**
   * Create the injected subject if it is not yet, and describe it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is created and returned.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; `installAutoMovieDraw` answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; `installAutoMovieDraw` answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; `installAutoMovieDraw` answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; `installAutoMovieDraw` answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; `installAutoMovieDraw` answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; `installAutoMovieDraw` answers.
   */
  describe(): Promise<IAutoMovieDrawDescription>;

  /**
   * Draw one picture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is returned.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; `installAutoMovieDraw` answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; `installAutoMovieDraw` answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; `installAutoMovieDraw` answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; `installAutoMovieDraw` answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; `installAutoMovieDraw` answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; `installAutoMovieDraw` answers.
   */
  draw(call: IAutoMovieDrawCall): Promise<IAutoMovieDrawResult>;
}
