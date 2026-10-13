/**
 * Source authority for display and each independently cached numerical domain.
 *
 * @evidence contracts/common.md#principled-implementation Separate browser, face, body and person digests retain the actual dependency authority of each cached runtime domain.
 * @evidence contracts/common.md#clear-and-simple-design The closed four-domain record keeps browser display authority apart from numerical cache keys.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Whole-person authority includes its face and body dependencies rather than substituting either domain digest.
 * @evidence contracts/common.md#meaningful-documentation Explains which loaded source and composed dependencies each digest represents.
 * @author Samchon
 */
export interface IHumanViewerRevisions {
  /** Source and input authority loaded by the browser and its worker. */
  browser: string;

  /** Face runtime dependencies, independent of body and person composition. */
  face: string;

  /** Body runtime dependencies, independent of face and person composition. */
  body: string;

  /**
   * Whole-person runtime, including its face, body and composition dependencies.
   */
  person: string;
}
