import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One inclusive run of sampled ground-plus-tolerance contacts and its fixed model-frame solve target. New targets use sampled ground Y; prior-beat opening pins may supply another position. Reach and ROM constraints can leave residual, so the record does not certify exact held contact. Start/end are clip-local seconds, and position is shared with the per-frame targets.
 *
 * @evidence contracts/common.md#principled-implementation Records a maximal inclusive stance run and one fixed model-frame contact target, matching pinStanceTargets' grouping of adjacent contact samples; a carried opening target preserves beat continuity.
 * @evidence contracts/common.md#clear-and-simple-design Separates compact stance metadata from dense corrected keyframes, so later beat handoff reads one contact per run instead of re-detecting stance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A new run pins its detected initial foot and ground height, while an opening run may retain the caller's prior target; neither path invents a contact for a non-stancing foot.
 * @evidence contracts/common.md#meaningful-documentation States inclusive local times, fixed model-frame position, ground snapping and the authoritative opening-target exception.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A stance record contains no contact-detection algorithm; contiguous-mask traversal belongs to pinStanceTargets.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The fixed position is shared by frames of this run, while transfer to a later beat is explicit caller input rather than an implicit cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One position and two times are owned by the planting result per detected run, with no process or resource handle.
 *
 * @author Samchon
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
