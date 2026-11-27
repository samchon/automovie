import type {
  AutoMovieSoftAnalysisStatus,
  IAutoMovieSoftBodySurface,
} from "@automovie/interface";
import type * as THREE from "three";

/**
 * A viewer-owned cloth projection of the currently uploaded canonical surface;
 * updates replace its domain metadata without checking domain identity.
 */
export interface IAutoMovieRenderSoftBodyObject {
  /** Add this mesh to the current scene. */
  object: THREE.Mesh;

  /**
   * Re-upload the panel at a newly analysed shot second.
   *
   * The status is required here for the same reason it is required to build the
   * object: it can change between seconds. A furnishing whose declared step
   * budget stops inside the cut is `solved` early and `not-run` later, and an
   * update that carried only geometry would leave the earlier claim standing
   * over the later panel.
   */
  update: (props: {
    surface: IAutoMovieSoftBodySurface;
    status: AutoMovieSoftAnalysisStatus;
  }) => void;

  /** Release the geometry, and the material when this object created it. */
  dispose: () => void;
}
