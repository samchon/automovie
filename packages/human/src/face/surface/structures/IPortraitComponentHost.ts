/**
 * The substrate a replaceable anatomical component fits. Landmark identities
 * belong to the subject's socket binding, never to the generic host assembler.
 *
 * @author Samchon
 */
export interface IPortraitComponentHost {
  /**
   * Original measured control positions, including any non-skin gaze markers,
   * in construction millimetres with +Y up and +Z anterior.
   */
  positions: number[][];

  /** Original oriented skin triangles; their ordinals identify removable faces. */
  indices: number[];

  /** Recorded image-depth direction used to preserve measured gaze placement; a direction, so it carries no unit. */
  viewRay: number[];
}
