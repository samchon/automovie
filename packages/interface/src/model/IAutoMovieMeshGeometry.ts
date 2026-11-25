import type { IAutoMovieMesh } from "./IAutoMovieMesh";

/** Geometry whose explicit triangle attributes belong to the enclosed mesh. */
export interface IAutoMovieMeshGeometry {
  /** Discriminator. */
  type: "mesh";

  /** The vertex data. */
  mesh: IAutoMovieMesh;
}
