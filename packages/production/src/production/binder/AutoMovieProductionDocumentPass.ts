/**
 * Physical construction or final pass selected for a reader edition; final is admitted only for screenplays.
 *
 * @evidence contracts/common.md#principled-implementation The closed construction/final union names existing physical authored trees; constructor runtime checks restrict final to screenplays.
 * @evidence contracts/common.md#clear-and-simple-design One public pass type controls routing and ancestor admission without another reader service.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported runtime pass values refuse rather than selecting an undocumented tree.
 * @evidence contracts/common.md#meaningful-documentation States physical pass meaning, construction default and the final-screenplay limitation through its consuming API.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type chooses no algorithm; routing and document readers own host work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration defines no cached pass or shared publication effect.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle, bytes or running task are owned by this type.
 */
export type AutoMovieProductionDocumentPass = "construction" | "final";
