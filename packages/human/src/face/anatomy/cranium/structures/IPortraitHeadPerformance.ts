/**
 * Reference formation and performance of newly appended head tissue. Existing
 * facial/component vertices keep their performed positions and shared IDs.
 * Only continuation vertices are posed before common refinement and normals.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-expression Separates reference cranial and cervical formation from performed facial attachments.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression Continues motion across shared tissue without applying it twice to resident oral components.
 */
export interface IPortraitHeadPerformance {
  /** Restore reference coordinates for construction; do not mutate the input. */
  reference: (point: number[], vertex: number) => number[];
  /** Pose one new reference vertex in millimetres; do not mutate the input. */
  pose: (point: number[]) => number[];
}
