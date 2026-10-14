import type { IAutoMovieHumanBodyAnatomicalVolume } from "./IAutoMovieHumanBodyAnatomicalVolume";

/**
 * A named cartilage tissue volume distinct from bone and fibrous ligament.
 *
 * Whole-volume imaging cannot determine an individual joint's thickness, curvature or contact pressure; these require separate generated surfaces.
 *
 * @evidence contracts/common.md#principled-implementation A required cartilage volume uses target/observation provenance while preserving cartilage identity apart from bone.
 * @evidence contracts/common.md#clear-and-simple-design One named cartilage tissue owns one material quantity; owning region supplies joint identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Whole-volume observations do not imply joint thickness, curvature or pressure/contact solutions.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes tissue ownership, millilitre units and separate surface/contact requirements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Cartilage quantity typing computes no articular thickness field or contact pressure.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This cartilage record shares no completed surface-fitting or contact solve across joints.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Cartilage metadata retains no articular meshes, pressure buffers or solver tasks.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyCartilageMeasurements {
  /** Segmented or target cartilage volume in millilitres. */
  readonly cartilageVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
