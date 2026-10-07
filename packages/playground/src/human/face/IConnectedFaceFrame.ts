import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

import type { IConnectedFaceMeshWitness } from "./IConnectedFaceMeshWitness";
import type { IConnectedFaceResident } from "./IConnectedFaceResident";

/**
 * A prepared face frame: the group it will be drawn by and the arrays it will write.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Holds an edit's prepared face frame until the editor publishes it, so a failed edit never replaces the shown face.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Pairs the prepared model with the resident group and witnesses it will write.
 * @author Samchon
 */
export interface IConnectedFaceFrame {
  /** Group the frame publishes into. */
  resident: IConnectedFaceResident;

  /** Numerical model of the frame. */
  model: IAutoMovieModel;

  /** Mesh of each part, in part order. */
  meshes: IAutoMovieMesh[];

  /** Witness of each mesh, in part order. */
  witnesses: IConnectedFaceMeshWitness[];
}
