import type { IAutoMovieVector3 } from "@automovie/interface";



/**
 * A named planar sheet whose triangles are accounted separately from the closed solid they lie on.
 */
export interface NamedSheet {
  /** Sheet identity. */
  id: string;
  /** Sheet corners in world metres. */
  corners: readonly IAutoMovieVector3[];
}
