import { IAutoMovieMesh } from "./IAutoMovieMesh";

/** Geometry defined by explicit triangle-mesh data. */
export interface IAutoMovieMeshGeometry {
  /** Discriminator. */
  type: "mesh";

  /** The vertex data. */
  mesh: IAutoMovieMesh;
}
