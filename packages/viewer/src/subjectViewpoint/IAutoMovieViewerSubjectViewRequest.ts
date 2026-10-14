import type * as THREE from "three";

import type { IAutoMovieViewerSnapshotOptions } from "../IAutoMovieViewerSnapshotOptions.js";
import type { IAutoMovieViewerSnapshotRenderer } from "../IAutoMovieViewerSnapshotRenderer.js";
import type { IAutoMovieViewerSubject } from "./IAutoMovieViewerSubject.js";
import type { IAutoMovieViewerSubjectPose } from "./IAutoMovieViewerSubjectPose.js";

/**
 * Borrowed scene, mutable camera, renderer and supplied subject/pose for synchronous inspection capture. Population resolution is required before drawing; the callback must actually resolve the supported scene population.
 *
 * @evidence contracts/common.md#principled-implementation Collects the exact pose, native scene/camera, snapshot port and mandatory pre-draw population callback; labels do not resolve the subject or verify renderer/source readiness.
 * @evidence contracts/common.md#clear-and-simple-design Camera application, population realization and snapshot encoding retain their existing owners and occur in that order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A mandatory callback cannot prove that its implementation resolves every population; there is no browser recovery, runtime source validation or hidden no-op replacement.
 * @evidence contracts/common.md#meaningful-documentation Documents borrowed resources, camera mutation, pre-draw callback and optional encoding/plan metadata.
 * @evidence contracts/performance.md#efficient-algorithms The request chooses no population algorithm; actual callback cost scales with supported populations and capture cost scales with draw/encoding.
 * @evidence contracts/performance.md#reuse-equivalent-work Each request performs its own pose mutation, resolution and draw; equal metadata alone cannot share these effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller keeps scene/camera/renderer alive and retires them; capture acquires no browser or worker and leaves applied state even on later failure.
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
   * Resolve the scene's supported compact populations against the applied camera world matrix and actual canvas height before drawing. The required callback must implement that work; its presence alone does not establish population completeness.
   *
   * @evidence contracts/common.md#principled-implementation The capture owner calls this synchronous effect after camera projection/world updates and before rendering, so each supported population can select its current visible chunks from the actual view.
   * @evidence contracts/common.md#clear-and-simple-design Scene population realization remains with the caller that knows its producers; capture owns ordering rather than another scene registry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A required typed function does not prove its body resolves populations, and no no-op fallback or fixture population replacement is supplied by capture.
   * @evidence contracts/common.md#meaningful-documentation States matrix/height inputs, synchronous ordering and the callback implementer's completeness responsibility.
   * @evidence contracts/performance.md#efficient-algorithms Actual cost depends on the caller's population and chunk selection; this signature promises no fixed traversal cost or native performance bound.
   * @evidence contracts/performance.md#reuse-equivalent-work The callback must use current camera, geometry/population and viewport state; equal labels alone cannot share prior mutation or realization effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows camera and caller-owned populations for the call; any retained chunk buffers and release protocol belong to their real producer, and a thrown callback leaves already applied camera state.
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
