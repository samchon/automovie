import type * as THREE from "three";

import type { IAutoMovieRenderViewerSnapshotOptions } from "./IAutoMovieRenderViewerSnapshotOptions.js";
import type { IAutoMovieRenderViewerSnapshotRenderer } from "./IAutoMovieRenderViewerSnapshotRenderer.js";
import type { IAutoMovieRenderViewerSubject } from "./IAutoMovieRenderViewerSubject.js";
import type { IAutoMovieRenderViewerSubjectPose } from "./IAutoMovieRenderViewerSubjectPose.js";

/**
 * Borrowed scene, mutable camera, renderer and supplied subject/pose for
 * synchronous inspection capture. Population resolution is required before
 * drawing; the callback must actually resolve the supported scene population.
 */
export interface IAutoMovieRenderViewerSubjectViewRequest {
  /** Subject being looked at. */
  subject: IAutoMovieRenderViewerSubject;

  /** Pose to render from. */
  pose: IAutoMovieRenderViewerSubjectPose;

  /** Planned viewpoint identity, when the pose came from a plan. */
  viewpoint?: string | null;

  /** Scene holding the subject. */
  scene: THREE.Scene;

  /** Camera the pose is written onto and the frame is drawn through. */
  camera: THREE.PerspectiveCamera;

  /** Renderer that draws and reads the frame back. */
  renderer: IAutoMovieRenderViewerSnapshotRenderer;

  /**
   * Resolve the scene's supported compact populations against the applied
   * camera world matrix and actual canvas height before drawing. The required
   * callback must implement that work; its presence alone does not establish
   * population completeness.
   */
  resolveForCamera: (
    camera: THREE.PerspectiveCamera,
    viewportHeight: number,
  ) => void;

  /** Image encoding options handed to the snapshot. */
  snapshot?: IAutoMovieRenderViewerSnapshotOptions;
}
