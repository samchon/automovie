import type { IAutoMovieSkeleton } from "@automovie/interface";

/**
 * Historical minimal model carrier accepted by portable scene admission. The current scene validator reads model ids for references and does not inspect the retained nullable skeleton field or perform FK/reach queries.
 *
 * @evidence contracts/common.md#principled-implementation Model identity and nullable skeleton preserve the legacy structural view; current validateSceneArtifact uses only identity membership, so skeleton presence establishes no articulated admission there.
 * @evidence contracts/common.md#clear-and-simple-design validateSceneArtifact consumes this small structural view instead of requiring complete appearance or imported-mesh metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stored-scene admission may construct id-only placeholders with null skeleton; neither that null nor a supplied skeleton certifies model kind or geometry, and no substitute rig is invented.
 * @evidence contracts/common.md#meaningful-documentation States scene-reference identity, the retained compatibility field and its current lack of runtime use by scene admission.
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
   * Retained nullable skeleton metadata, unused by the current portable scene validator; null supplies no proof that the referenced model is a prop.
   */
  skeleton: IAutoMovieSkeleton | null;
}
