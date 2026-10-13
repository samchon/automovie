import type { IAutoMovieHumanFaceNasolabialRelief } from "../IAutoMovieHumanFaceNasolabialRelief";

/**
 * Anatomical sides in the basis frame (+X left), each independently omitted.
 *
 * @evidence contracts/common.md#principled-implementation Independent left/right authored depths feed the current skin's same-side source-smile/material-course relief owner without copying an omitted side.
 * @evidence contracts/common.md#clear-and-simple-design Two optional canonical NasolabialRelief records separate side selection from depth/width semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Side labels supply no measured fold geometry; active requests still require corresponding source alar/cheilion and lip/material support.
 * @evidence contracts/common.md#meaningful-documentation Anatomical +X left and independent omission distinguish source-frame laterality from camera mirroring.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The pair performs no guide lookup or displacement.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source side ownership implements no current-skin cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Optional caller records create no mesh or contact derivative.
 *
 * @author Samchon
 */
export interface Nasolabial {
  /** Relief on the anatomical left. */
  left?: IAutoMovieHumanFaceNasolabialRelief;

  /** Relief on the anatomical right. */
  right?: IAutoMovieHumanFaceNasolabialRelief;
}
