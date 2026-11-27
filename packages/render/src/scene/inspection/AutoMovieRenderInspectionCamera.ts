import { type Box3, type Mesh, type Object3D, type Camera, type Plane, type Matrix4, type Scene } from "three";
import type { IAutoMovieCameraInspection, IAutoMovieInspectionDiagnostics, IAutoMovieSubjectBox, IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieDrawScene } from "../../draw/IAutoMovieDrawScene.js";
import { boundAutoMovieCameraSubject as boundAutoMovieCameraSubjectImplementation } from "./internal/boundAutoMovieCameraSubject.js";
import { listAutoMovieCameraSubjectMeshes as listAutoMovieCameraSubjectMeshesImplementation } from "./internal/listAutoMovieCameraSubjectMeshes.js";
import { measureAutoMovieCameraFrameEdgeSurface as measureFrameEdgeSurfaceImplementation } from "./internal/measureAutoMovieCameraFrameEdgeSurface.js";

import { measureAutoMovieCameraNearClip } from "./internal/measureAutoMovieCameraNearClip.js";
import { measureAutoMovieCameraFrameEdge } from "./internal/measureAutoMovieCameraFrameEdge.js";
import { observeAutoMovieCameraInspection } from "./internal/observeAutoMovieCameraInspection.js";
import { observeAutoMoviePlacedCamera } from "./internal/observeAutoMoviePlacedCamera.js";

/** Public operations for Auto Movie Render Inspection Camera. */
export namespace AutoMovieRenderInspectionCamera {
  /** Named public input and result contracts for near-clip measurement. */
  export namespace NearClip {
    /** The delivery camera and a required subject's admitted meshes. */
    export interface IProps {
      /**
       * Delivery camera with its world matrices and projection, crop included,
       * already current.
       */
      camera: Camera;
      /**
       * Meshes from listAutoMovieCameraSubjectMeshes with current world matrices
       * and poses, or undefined when it refused the subject.
       */
      meshes: readonly Mesh[] | undefined;
      /**
       * Optional independently certified world envelope of the whole placed
       * subject, metres.
       */
      bounds?: IAutoMovieSubjectBox;
      /** Largest number of drawn triangles this call may examine. */
      triangleBudget: number;
    }

    /** Clear, clipped with its deepest witness, or unmeasured with a reason. */
    export type IResult =
      | {
          /** Every examined triangle stays on or beyond the near plane inside the frame. */
          status: "clear";
          /** Drawn triangles examined. */
          triangles: number;
        }
      | {
          /** Some drawn surface inside the frame lies in front of the near plane. */
          status: "clipped";
          /** Drawn triangles examined. */
          triangles: number;
          /** Deepest intrusion in front of the near plane, world metres. */
          depth: number;
          /** World surface point of that intrusion, metres. */
          point: IAutoMovieVector3;
          /**
           * World point on the near plane at the same delivered pixel, metres,
           * where the cut shows in the frame.
           */
          cut: IAutoMovieVector3;
          /**
           * Whether the reported intrusion lies on an opaque stock surface;
           * false means the cut part may be invisible anyway.
           */
          opaque: boolean;
        }
      | {
          /**
           * The drawn triangles in front of the near plane exceed the caller's
           * budget; a larger budget completes the check.
           */
          status: "over-budget";
          /** How far the budget fell short. */
          reason: string;
        }
      | {
          /**
           * The surface cannot be checked: an unreadable drawable, a non-finite
           * vertex or projection, or an invalid budget.
           */
          status: "unmeasured";
          /** Why the check cannot run. */
          reason: string;
        };
  }

  /** Named public input and result contracts for original-camera observation. */
  export namespace Observe {
    /** The delivered camera and one source-resolved requirement, after placement. */
    export interface IProps {
      /** Original displayed scene, before inspection overlays are installed. */
      scene: Scene;
      /** Output camera with delivery aspect and crop already applied. */
      camera: Camera;
      /** Resolved displayed root of the required subject, when available. */
      target: Object3D | undefined;
      /** Optional independently certified full world envelope of the placed subject. */
      targetBounds?: IAutoMovieSubjectBox;
      /** Source-authored maximum pixel-occlusion ratio. */
      maxOcclusionRatio?: number;
      /** Maximum total triangles admitted to the optional, nine-ray witness pass. */
      triangleBudget?: number;
      /** Matching exact pixel observations, when a capture or delivery audit obtained them. */
      pixels?: IAutoMovieCameraInspection.IPixels;
    }

    /** Independent framing and occlusion grades. */
    export type IResult = IAutoMovieCameraInspection.IResult;
  }

  /** Named public input and result contracts for placed-camera observation. */
  export namespace ObservePlaced {
    /** A source requirement active in the placed sample. */
    export interface IRequirement {
      /** Stable path of the authored subject within its source scope. */
      readonly path: string;
      /** Source-resolved displayed object, absent when resolution failed. */
      readonly target: Object3D | undefined;
      /** Authored maximum fraction, inclusive, when the source requires pixel coverage. */
      readonly maxOcclusionRatio?: number;
      /** Optional certified envelope of the whole posed subject in world metres. */
      readonly targetBounds?: IAutoMovieSubjectBox;
    }

    /** Settled sample and its active source requirements. */
    export interface IProps {
      /** Settled original scene and delivery projection, before inspection effects. */
      sample: IAutoMovieDrawScene.IPlacedSample;
      /** Source-owned requirements active at this sample's exact time. */
      targets: readonly IRequirement[];
    }

    /** Independent diagnostic rows emitted by placed camera observation. */
    export type IResult = Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage">;
  }

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
    props: NearClip.IProps,
  ): NearClip.IResult {
    return measureAutoMovieCameraNearClip(props);
  }
  /** Observes required-subject framing from the original delivered projection. */
  export function observe(
    props: Observe.IProps,
  ): Observe.IResult {
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
    props: ObservePlaced.IProps,
  ): ObservePlaced.IResult {
    return observeAutoMoviePlacedCamera(props);
  }
  /**
   * Measure where the sides of the delivered frame cut a required subject.
   *
   * The subject's world box, or its certified envelope, crosses a side plane when
   * its outermost corner lies outside that plane beyond the 32-ulp slack the
   * framing grade uses. For each crossed side, the extent is how far the part of
   * the box beyond the near plane reaches past that edge, in normalized device
   * units: the frame spans -1 to 1 on each axis, crop and aspect included. It is
   * read at the vertices of the box clipped by the near plane, because a
   * perspective projection of a convex solid reaches its extremes at vertices. A
   * side crossed only on the camera side of the near plane has no extent: that
   * part is never drawn, so it cannot be cut.
   *
   * When some side has an extent and the meshes are readable,
   * `measureFrameEdgeSurface` confirms or clears the cut on the drawn surface and
   * measures the visible fraction.
   *
   * @param props Delivery camera, subject bounds and meshes, and the triangle
   *   budget.
   * @returns `inside` when the bounds cross no side plane, `crossed` with the
   *   crossed sides, their extents and the surface outcome, or `unmeasured` with
   *   the reason the bounds or projection cannot be read.
   */
  export function measureFrameEdge(
    props: FrameEdge.IProps,
  ): FrameEdge.IResult {
    return measureAutoMovieCameraFrameEdge(props);
  }

  /** Frame-edge input and outcome types shared by the camera evaluator. */
  export namespace FrameEdge {
    /** The delivery camera and a required subject's bounds and admitted meshes. */
    export interface IProps {
      /**
       * Delivery camera with its world matrices and projection, crop included,
       * already current.
       */
      camera: Camera;
      /**
       * Meshes from listAutoMovieCameraSubjectMeshes with current world matrices
       * and poses, or undefined when it refused the subject.
       */
      meshes: readonly Mesh[] | undefined;
      /**
       * Optional independently certified world envelope of the whole placed
       * subject, metres. It replaces the mesh box for the side test.
       */
      bounds?: IAutoMovieSubjectBox;
      /** Largest number of drawn triangles the surface check may examine. */
      triangleBudget: number;
    }

    /** A side of the delivered frame. */
    export type Side = "left" | "right" | "bottom" | "top";

    /** One side plane the subject's bounds cross. */
    export interface ICrossing {
      /** The crossed side. */
      side: Side;
      /**
       * How far the bounds beyond the near plane reach past this edge, in
       * normalized device units; absent when only the part before the near plane
       * crosses.
       */
      extent?: number;
    }

    /** Inside every side, crossing some side, or unmeasured. */
    export type IResult =
      | { /** The bounds lie inside all four side planes. */ status: "inside" }
      | {
          /** The bounds cross at least one side plane. */
          status: "crossed";
          /** Crossed sides in right, left, bottom, top order. */
          crossings: ICrossing[];
          /** The surface check of the cut, or clear when no crossing has extent. */
          surface: IFrameEdgeSurfaceResult;
        }
      | {
          /** The bounds or projection cannot be read. */
          status: "unmeasured";
          /** Why the check cannot run. */
          reason: string;
        };
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
