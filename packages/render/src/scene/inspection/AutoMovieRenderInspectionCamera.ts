import { type Box3, type Mesh, type Object3D, type Camera, type Plane, type Matrix4 } from "three";
import { boundAutoMovieCameraSubject as boundAutoMovieCameraSubjectImplementation } from "./internal/boundAutoMovieCameraSubject.js";
import { listAutoMovieCameraSubjectMeshes as listAutoMovieCameraSubjectMeshesImplementation } from "./internal/listAutoMovieCameraSubjectMeshes.js";
import { measureAutoMovieCameraFrameEdgeSurface as measureFrameEdgeSurfaceImplementation } from "./internal/measureAutoMovieCameraFrameEdgeSurface.js";

import { measureAutoMovieCameraNearClip } from "./internal/measureAutoMovieCameraNearClip.js";
import { observeAutoMovieCameraInspection } from "./internal/observeAutoMovieCameraInspection.js";
import { observeAutoMoviePlacedCamera } from "./internal/observeAutoMoviePlacedCamera.js";

/** Public operations for Auto Movie Render Inspection Camera. */
export namespace AutoMovieRenderInspectionCamera {
  /**
   * Measure how far a required subject's drawn surface reaches in front of the
   * delivery near plane inside the delivered frame.
   *
   * The GPU clips every triangle against the near plane, so any part of the
   * subject's surface that lies inside the four side planes and on the camera
   * side of the near plane is cut out of the delivered picture: the camera has
   * entered the subject. Each drawn triangle is clipped to the four side planes
   * (Sutherland-Hodgman); signed distance to the near plane is linear over the
   * remaining convex polygon, so its deepest point is a polygon vertex.
   *
   * @param props Delivery camera, admitted subject meshes and the triangle
   *   budget.
   * @returns `clear` when no drawn surface crosses, `clipped` with the deepest
   *   intrusion in metres, its world surface point and the near-plane point at
   *   the same delivered pixel, `over-budget` when the triangles to examine
   *   exceed the budget, or `unmeasured` with the reason the subject cannot be
   *   checked.
   */
  export function measureNearClip(
    props: Parameters<typeof measureAutoMovieCameraNearClip>[0],
  ): ReturnType<typeof measureAutoMovieCameraNearClip> {
    return measureAutoMovieCameraNearClip(props);
  }
  /** Observes required-subject framing from the original delivered projection. */
  export function observe(
    props: Parameters<typeof observeAutoMovieCameraInspection>[0],
  ): ReturnType<typeof observeAutoMovieCameraInspection> {
    return observeAutoMovieCameraInspection(props);
  }

  /**
   * Observe active, source-owned requirements on the host's original delivery
   * camera.
   *
   * The interactive Viewer checks each painted frame under fixed triangle budgets
   * and reports a check they stop as `deferred`. Capture and delivery run every
   * camera check without a budget, and they audit authored pixel coverage with
   * the host renderer, so they leave nothing deferred. A check that cannot run on
   * the subject at all is `unsupported` in every host.
   *
   * A subject whose bounds cross a side of the frame gets an optional
   * `camera-frame-edge` check: a cut by the frame edge is often the intended
   * composition, so it is a `frame-edge-cut` warning that never blocks delivery.
   *
   * @param props The placed sample and the requirements active at its time.
   * @returns Findings and one coverage row per check and requirement.
   */
  export function observePlaced(
    props: Parameters<typeof observeAutoMoviePlacedCamera>[0],
  ): ReturnType<typeof observeAutoMoviePlacedCamera> {
    return observeAutoMoviePlacedCamera(props);
  }
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
