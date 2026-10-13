import type * as THREE from "three";
import type { IAutoMovieViewerSnapshotOptions, IAutoMovieViewerSnapshotRenderer } from "../snapshot.js";
import type { IAutoMovieViewerSubject } from "./IAutoMovieViewerSubject.js";
import type { IAutoMovieViewerSubjectPose } from "./IAutoMovieViewerSubjectPose.js";

/**
 * Everything one pose-to-image call needs.
 *
 * @author Samchon
 */
export interface IAutoMovieViewerSubjectViewRequest {
  /**
   * Subject being looked at.
   */
  subject: IAutoMovieViewerSubject;

  /**
   * Pose to render from.
   */
  pose: IAutoMovieViewerSubjectPose;

  /**
   * Planned viewpoint identity, when the pose came from a plan.
   */
  viewpoint?: string | null;

  /**
   * Scene holding the subject.
   */
  scene: THREE.Scene;

  /**
   * Camera the pose is written onto and the frame is drawn through.
   */
  camera: THREE.PerspectiveCamera;

  /**
   * Renderer that draws and reads the frame back.
   */
  renderer: IAutoMovieViewerSnapshotRenderer;

  /**
   * Tell every compact population where the eye is, before the frame is drawn.
   *
   * Required, and required for one reason. A scene drawn without this call
   * keeps its ordinary meshes and silently drops every instanced population,
   * which reads as a bare roof rather than as a missing call; four rounds of
   * one survey were spent reporting absences that were never absent. A caller
   * that must pass this cannot forget it, so the trap is closed by the type
   * rather than by a comment.
   */
  resolveForCamera: (
    camera: THREE.PerspectiveCamera,
    viewportHeight: number,
  ) => void;

  /**
   * Image encoding options handed to the snapshot.
   */
  snapshot?: IAutoMovieViewerSnapshotOptions;
}
