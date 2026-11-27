import { type Box3, type Mesh, type Object3D, type Camera, type Plane, type Matrix4 } from "three";
import { boundAutoMovieCameraSubject as boundAutoMovieCameraSubjectImplementation } from "./internal/boundAutoMovieCameraSubject.js";
import { listAutoMovieCameraSubjectMeshes as listAutoMovieCameraSubjectMeshesImplementation } from "./internal/listAutoMovieCameraSubjectMeshes.js";
import { measureAutoMovieCameraFrameEdgeSurface as measureFrameEdgeSurfaceImplementation } from "./internal/measureAutoMovieCameraFrameEdgeSurface.js";

/** Public operations for Auto Movie Render Inspection Camera. */
export namespace AutoMovieRenderInspectionCamera {
  /** Inputs for one required subject's camera frame-edge surface check. */
  export interface IFrameEdgeSurfaceProps {
    /** Admitted meshes with current world matrices and poses. */
    meshes: readonly Mesh[];
    /** Four normalized inward side planes of the delivery frustum. */
    sides: readonly Plane[];
    /** Normalized inward near plane of the delivery frustum. */
    near: Plane;
    /** World-to-clip matrix with crop and aspect included. */
    projection: Matrix4;
    /** Largest number of drawn triangles this call may examine. */
    triangleBudget: number;
  }
  /** Outcome of one camera frame-edge surface check. */
  export type IFrameEdgeSurfaceResult = measureFrameEdgeSurfaceImplementation.IResult;
  /**
   * Enclose the current world geometry of a required subject's admitted meshes.
   *
   * A rigid mesh contributes its geometry box under its world matrix. An owned
   * skin contributes its exact posed local extent, already grown by its float32
   * GPU tolerance, under its world matrix; Three keeps posed skinned positions in
   * the mesh's local frame, so the same world transform applies to both.
   *
   * @param meshes Meshes from listAutoMovieCameraSubjectMeshes, with current
   *   world matrices.
   * @returns A finite world box in metres, or undefined when the list is empty or
   *   any contribution is empty or non-finite.
   */
  export function boundSubject(meshes: readonly Mesh[]): Box3 | undefined {
    return boundAutoMovieCameraSubjectImplementation(meshes);
  }

  /**
   * List the drawables of a required subject whose current geometry the CPU can
   * read.
   *
   * Admits two vertex paths. A rigid `Mesh` keeps the stock pre-render callbacks,
   * has no position morphs and no material that moves vertices on the GPU, so its
   * buffer positions times its world matrix are what the delivery draws. An
   * `AutoMovieSkinnedMesh` with a stock surface whose shader matches its skinning
   * method reads posed positions from the skin's own CPU evaluation, which agrees
   * with the GPU blend within the mesh's stated float32 tolerance.
   *
   * @param target Resolved displayed root of the required subject.
   * @param camera Delivery camera; only objects on its layers are drawn by it.
   * @returns Every visible drawable mesh of the subject, or undefined when one
   *   visible drawable has a vertex path the CPU cannot reproduce. An empty list
   *   means the subject draws no mesh.
   */
  export function listSubjectMeshes(target: Object3D, camera: Camera): Mesh[] | undefined {
    return listAutoMovieCameraSubjectMeshesImplementation(target, camera);
  }
  /**
   * Check a required subject's drawn surface against the sides of the delivered
   * frame, under the caller's triangle budget.
   *
   * @param props Admitted meshes, the delivery frustum planes and projection,
   *   and the triangle budget.
   * @returns The cut, clear, over-budget or unmeasured outcome.
   */
  export function measureFrameEdgeSurface(
    props: IFrameEdgeSurfaceProps,
  ): IFrameEdgeSurfaceResult {
    return measureFrameEdgeSurfaceImplementation(props);
  }
}
