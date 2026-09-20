/**
 * The substrate a replaceable anatomical component fits. Landmark identities
 * belong to the subject's socket binding, never to the generic host assembler.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Separates caller-owned anatomical landmark bindings from the generic component assembler.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Carries original control coordinates, removable face ordinals and the observed view direction used during fitting.
 */
export interface IPortraitComponentHost {
  /** Original measured control positions, including any non-skin gaze markers. */
  positions: number[][];

  /** Original oriented skin triangles; their ordinals identify removable faces. */
  indices: number[];

  /** Recorded image-depth direction used to preserve measured gaze placement. */
  viewRay: number[];
}
