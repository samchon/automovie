import type { IAutoMovieSkeleton } from "@automovie/interface";

/**
 * Minimal model geometry lookup the v1 store answered with.
 *
 * @evidence contracts/common.md#principled-implementation The scene validator receives only model identity and nullable skeleton, the projection it needs for model references and articulated checks.
 * @evidence contracts/common.md#clear-and-simple-design validateSceneArtifact consumes this small structural view instead of requiring complete appearance or imported-mesh metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A null skeleton remains an unarticulated model and no substitute rig or geometry is invented.
 * @evidence contracts/common.md#meaningful-documentation States scene-reference identity and the articulated-versus-prop skeleton distinction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The two-field view computes no FK or model lookup; scene admission owns reference verification.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A skeleton reference carries geometry facts and supplies no retained reach or projection-query answer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The validator borrows id and nullable skeleton from its caller, and this view opens no resource.
 * @author Samchon
 */
export interface IAutoMovieLegacyGeometryModel {
  /**
   * Model id referenced by scene nodes.
   */
  id: string;

  /**
   * Skeleton used for FK and reach queries; null for props.
   */
  skeleton: IAutoMovieSkeleton | null;
}
