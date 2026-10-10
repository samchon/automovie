import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Shared medial caruncle/plica sheet and lower wet-margin patch.
 *
 * createPortraitOcularTissues returns these owned lattices in head millimetres.
 * Null preserves an explicitly zero authored extent rather than an empty mesh.
 *
 * @author Samchon
 */
export interface IPortraitOcularTissueMeshes {
  /** Shared medial caruncle/plica lattice, or null when its authored extent is zero. */
  corner: IAutoMovieMesh | null;

  /** Lower wet-margin lattice, or null when its authored maximum width is zero. */
  lowerMargin: IAutoMovieMesh | null;
}
