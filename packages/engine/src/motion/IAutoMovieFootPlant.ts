import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One inclusive run of sampled ground-plus-tolerance contacts and its fixed model-frame solve target. New targets use sampled ground Y; prior-beat opening pins may supply another position. Reach and ROM constraints can leave residual, so the record does not certify exact held contact. Start/end are clip-local seconds, and position is shared with the per-frame targets.
 *
 * @evidence contracts/development/design.md#principled-representation Records a maximal inclusive stance run and one fixed model-frame contact target, matching pinStanceTargets' grouping of adjacent contact samples; a carried opening target preserves beat continuity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Separates compact stance metadata from dense corrected keyframes, so later beat handoff reads one contact per run instead of re-detecting stance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A new run pins its detected initial foot and ground height, while an opening run may retain the caller's prior target; neither path invents a contact for a non-stancing foot.
 * @evidence contracts/development/common.md#meaningful-documentation States inclusive local times, fixed model-frame position, ground snapping and the authoritative opening-target exception.
 */
export interface IAutoMovieFootPlant {
  /** The planted foot bone. */
  foot: AutoMovieHumanoidBone;

  /** Inclusive stance-run start, seconds. */
  start: number;

  /** Inclusive stance-run end, seconds. */
  end: number;

  /** Fixed model-frame solve target; ground-snapped unless an opening pin supplied it. */
  position: IAutoMovieVector3;
}
