/**
 * Reference formation and performance of newly appended head tissue. Existing
 * facial/component vertices keep their performed positions and shared IDs.
 * Only continuation vertices are posed before common refinement and normals.
 *
 * @author Samchon
 */
export interface IPortraitHeadPerformance {
  /** Restore reference coordinates for construction; do not mutate the input. */
  reference: (point: number[], vertex: number) => number[];

  /** Pose one new reference vertex in millimetres; do not mutate the input. */
  pose: (point: number[]) => number[];
}
