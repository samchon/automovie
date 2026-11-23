import type { IAutoMovieFluidSurface } from "@automovie/interface";
import type * as THREE from "three";

/** A viewer-owned water surface bound to one fluid domain. */
export interface IAutoMovieFluidSurfaceObject {
  /** Add this mesh to the current scene. */
  object: THREE.Mesh;

  /**
   * Re-upload a newly solved surface of the same domain. A different domain
   * refuses before mutation because the mesh's segmentation identity belongs to
   * its original domain.
   */
  update: (surface: IAutoMovieFluidSurface) => void;

  /** Release the geometry, and the material when this object created it. */
  dispose: () => void;
}
