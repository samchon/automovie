import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Actual same-domain skin parts and the body's canonical sample addresses.
 *
 * Render parts may duplicate a sample at UV or material seams. Their
 * physicalVertices metadata owns that sample identity. The reader preserves
 * its actual position and rejects disagreeing aliases rather than welding
 * nearby coordinates. Skin-part selection and the common evaluated frame
 * belong to the caller; the reader neither chooses anatomy nor transforms it.
 *
 * @evidence contracts/common.md#principled-implementation Canonical physical sample identities recover native body addresses independently of UV duplication and render vertex ordering.
 * @evidence contracts/common.md#clear-and-simple-design Skin meshes, their one physical domain and native body sample addresses are the complete input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate proximity or inferred tissue mask substitutes for declared sample identity.
 * @evidence contracts/common.md#meaningful-documentation States alias ownership, selection responsibility and the absence of frame conversion.
 * @evidence contracts/modeling.md#spatial-conventions All meshes already occupy one evaluated metre frame; sample IDs have no spatial units.
 * @evidence contracts/modeling.md#shared-boundaries The caller supplies both continued skin partitions with their actual shared sample identities.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Existing skin parts are inputs and retain their owners' identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels No body trait or physiological motion is authored here.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The input only carries already emitted meshes.
 * @evidenceExclude contracts/modeling.md#rendered-observation The carrier displays nothing; its construction owner observes the input skin.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no tissue measurements or defaults.
 * @evidenceExclude contracts/anatomy.md#permitted-range Sample addressing is not an anatomical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This internal readback input adds no personal geometry authoring.
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
