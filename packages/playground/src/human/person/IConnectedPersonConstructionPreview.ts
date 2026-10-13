import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";

/**
 * A prepared viewport model and its source owner's actual admission report. It is separate from the accepted editor snapshot and undo history.
 *
 * Preparation can return an owner-refused construction for inspection. The caller must publish or retire its prepared viewport resources while preserving the report's refused qualification; readiness alone does not enter accepted history.
 *
 * @evidence contracts/common.md#principled-implementation Pairing one prepared model with its unchanged owner admission keeps inspectable refused construction distinct from an accepted editor snapshot.
 * @evidence contracts/common.md#clear-and-simple-design The prepared preview contains only frame and report while the panel owns draft identity, history and subsequent publication or retirement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A prepared drawable does not become accepted merely because its GPU resources are ready, and refused reports retain their actual owner failures.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies refusal-inclusive preparation, publish-or-retire ownership and exclusion from accepted history.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This preview result type chooses no numerical construction or texture preparation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record declares no equivalent-frame cache or sharing across authored documents.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Resource lifetime is exposed through the model but actual acquisition/retirement stays with the viewport and publishing caller.
 *
 * @author Samchon
 */
export interface IConnectedPersonConstructionPreview<Model> {
  /** Prepared model owned by this preview; the same viewport publishes it. */
  model: Model;

  /** Original checks of this exact model, without renderer or UI reinterpretation. */
  admission: IAutoMovieHumanConstructionAdmission;
}
