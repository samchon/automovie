import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Actual same-domain skin parts and the body's canonical sample addresses.
 *
 * Render parts may duplicate a sample at UV or material seams. Their physicalVertices metadata owns that sample identity. The reader preserves its actual position and rejects disagreeing aliases rather than welding nearby coordinates. Skin-part selection and the common evaluated frame belong to the caller; the reader neither chooses anatomy nor transforms it.
 *
 * @evidence contracts/common.md#principled-implementation Actual common-frame skin parts and physical domain/sample IDs recover canonical native origins across material/UV aliases.
 * @evidence contracts/common.md#clear-and-simple-design The caller owns skin selection/frame while the reader owns exact physical-sample correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Disagreeing aliases refuse instead of averaging coordinates or welding nearby points into invented identity.
 * @evidence contracts/common.md#meaningful-documentation Members document selected meshes, one physical domain and native sample order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Exterior inputs run no alias recovery or physical-vertex validation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Physical IDs describe equivalence premises without caching recovered exteriors themselves.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed skin arrays/sample IDs own no merged geometry allocation or task.
 * @author Samchon
 */
export interface IHumanBodyLayerExteriorInput {
  /** Actual final skin parts in their one common evaluated frame. */
  meshes: readonly IAutoMovieMesh[];

  /** Physical source domain shared by every selected skin sample. */
  domain: string;

  /** Canonical source sample ID in the body's native vertex order. */
  samples: readonly number[];
}
