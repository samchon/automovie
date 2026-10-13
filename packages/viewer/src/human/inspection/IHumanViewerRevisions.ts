/**
 * Source authority for display and each independently cached numerical domain.
 *
 * @evidence contracts/common.md#principled-implementation Separate browser, face, body and person digests retain the actual dependency authority of each cached runtime domain.
 * @evidence contracts/common.md#clear-and-simple-design The closed four-domain record keeps browser display authority apart from numerical cache keys.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Whole-person authority includes its face and body dependencies rather than substituting either domain digest.
 * @evidence contracts/common.md#meaningful-documentation Explains which loaded source and composed dependencies each digest represents.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Separate browser, face, body and person digests retain the actual dependency authority of each cached runtime domain.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The closed four-domain record keeps browser display authority apart from numerical cache keys.
 * @author Samchon
 */
export interface IHumanViewerRevisions {
  /**
   * Source and input authority loaded by the browser and its worker.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Source and input authority loaded by the browser and its worker. Separate browser, face, body and person digests retain the actual dependency authority of each cached runtime domain.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Source and input authority loaded by the browser and its worker. The closed four-domain record keeps browser display authority apart from numerical cache keys.
   */
  browser: string;

  /**
   * Face runtime dependencies, independent of body and person composition.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Face runtime dependencies, independent of body and person composition. Separate browser, face, body and person digests retain the actual dependency authority of each cached runtime domain.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Face runtime dependencies, independent of body and person composition. The closed four-domain record keeps browser display authority apart from numerical cache keys.
   */
  face: string;

  /**
   * Body runtime dependencies, independent of face and person composition.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Body runtime dependencies, independent of face and person composition. Separate browser, face, body and person digests retain the actual dependency authority of each cached runtime domain.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Body runtime dependencies, independent of face and person composition. The closed four-domain record keeps browser display authority apart from numerical cache keys.
   */
  body: string;

  /**
   * Whole-person runtime, including its face, body and composition dependencies.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Whole-person runtime, including its face, body and composition dependencies. Separate browser, face, body and person digests retain the actual dependency authority of each cached runtime domain.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Whole-person runtime, including its face, body and composition dependencies. The closed four-domain record keeps browser display authority apart from numerical cache keys.
   */
  person: string;
}
