import { IAutoMovieMesh } from "./IAutoMovieMesh";

/**
 * Geometry whose explicit triangle attributes belong to the enclosed mesh.
 *
 * @evidence contracts/development/design.md#principled-representation The mesh discriminator selects resident vertex attributes and triangle indices rather than primitive tessellation; validateModel delegates this arm to validateMesh for alignment, references and topology admission.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The wrapper contributes only representation identity; all vertex, skin and physical-correspondence fields stay together on IAutoMovieMesh.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The wrapper grants no exemption from mesh validation and says nothing about import provenance, so generated and imported triangle data use the same representation rules.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the explicit triangle representation and the enclosed mesh's ownership of vertex attributes; the discriminator is separate from model origin.
 */
export interface IAutoMovieMeshGeometry {
  /** Discriminator. */
  type: "mesh";

  /** The vertex data. */
  mesh: IAutoMovieMesh;
}
