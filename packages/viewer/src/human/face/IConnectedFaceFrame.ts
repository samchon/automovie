import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

import type { IConnectedFaceMeshWitness } from "./IConnectedFaceMeshWitness.js";
import type { IConnectedFaceResident } from "./IConnectedFaceResident.js";

/**
 * A prepared face frame: the group it will be drawn by and the arrays it will write.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation A prepared numerical model, ordered meshes and witnesses refer to one GPU resident. Witness checks bind Float32/topology admission to the tracked mesh arrays and closure requirement; the caller must preserve part order/static configuration while holding the frame before publication.
 * @evidence contracts/common.md#clear-and-simple-design One frame carries publication data without attaching its group or committing the editor's document; those effects belong to the viewport and application respectively.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A prepared frame is not declared displayed, admitted clinical history or exported GLB. Ordered mesh correspondence is real model data rather than a fixture-derived part list.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish numerical model, resident, part-ordered meshes and admission witnesses; preparation transfers a candidate whose discard remains explicit.
 * @evidence contracts/performance.md#efficient-algorithms The record retains part and witness references; preparation and publication costs scale with mesh buffers and are owned by the face renderer rather than hidden by this type.
 * @evidence contracts/performance.md#reuse-equivalent-work Compatible frames may point to the active resident while carrying different numerical coordinates; witness equality reuses a geometry verdict only for the same arrays and closure obligation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Accepted resident resources remain renderer-owned until replacement/close. A discarded nonactive frame requests resident retirement; retaining frames can retain numerical arrays, and this type supplies no outstanding-frame cap.
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
