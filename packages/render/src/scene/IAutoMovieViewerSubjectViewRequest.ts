import type * as THREE from "three";

import type { IAutoMovieViewerSnapshotOptions } from "./IAutoMovieViewerSnapshotOptions.js";
import type { IAutoMovieViewerSnapshotRenderer } from "./IAutoMovieViewerSnapshotRenderer.js";
import type { IAutoMovieViewerSubject } from "./IAutoMovieViewerSubject.js";
import type { IAutoMovieViewerSubjectPose } from "./IAutoMovieViewerSubjectPose.js";

/**
 * Borrowed scene, mutable camera, renderer and supplied subject/pose for
 * synchronous inspection capture. Population resolution is required before
 * drawing; the callback must actually resolve the supported scene population.
 */
export interface IAutoMovieViewerSubjectViewRequest {
  /** Subject being looked at. */
  subject: IAutoMovieViewerSubject;

  /** Pose to render from. */
  pose: IAutoMovieViewerSubjectPose;

  /** Planned viewpoint identity, when the pose came from a plan. */
  viewpoint?: string | null;

  /** Scene holding the subject. */
  scene: THREE.Scene;

  /** Camera the pose is written onto and the frame is drawn through. */
  camera: THREE.PerspectiveCamera;

  /** Renderer that draws and reads the frame back. */
  renderer: IAutoMovieViewerSnapshotRenderer;

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
  snapshot?: IAutoMovieViewerSnapshotOptions;
}
