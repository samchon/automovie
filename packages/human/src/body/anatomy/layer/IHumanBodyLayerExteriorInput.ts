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
