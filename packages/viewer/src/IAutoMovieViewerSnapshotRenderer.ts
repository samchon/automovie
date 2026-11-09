import type * as THREE from "three";

/**
 * Original synchronous draw and canvas readout required by the low-level snapshot adapter. A real WebGLRenderer satisfies this shape, but structural compatibility alone cannot establish native pixels, hardware or source validity. The caller owns the live matching canvas/renderer and its shutdown.
 *
 * @evidence contracts/development/design.md#principled-representation Defines the original synchronous scene/camera draw and canvas extent/encoding operations required by the low-level snapshot adapter.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A small structural host boundary avoids importing browser-global acquisition into the capture function while native host ownership stays explicit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shape compatibility, a data URL or a fake implementation cannot prove an actual renderer, completed pixels, current source or hardware readiness; the host must supply its genuine draw/encoder when those claims are needed.
 * @evidence contracts/development/common.md#meaningful-documentation Documents draw-before-read, physical canvas extent and original encoder fallback/failure responsibility.
 */
export interface IAutoMovieViewerSnapshotRenderer {
  /**
   * Render the scene from the camera before the canvas is read.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Invokes the supplied original scene/camera drawing operation synchronously before its own canvas is encoded.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw ownership remains with the concrete host while capture coordinates ordering only.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An asynchronous or invented draw cannot certify completed pixels through this void boundary; genuine live renderer and matching canvas are caller premises.
   * @evidence contracts/development/common.md#meaningful-documentation Documents original draw responsibility, scene/camera borrowing and draw-before-read ordering.
   * @evidence contracts/development/implementation.md#efficient-algorithms Actual native scene/render cost belongs to the host, with no extra scene traversal imposed by this callable contract.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every requested capture owns a fresh draw effect; equal scene/camera object identities do not permit skipping a changed frame.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Scene/camera are borrowed and the host owns all draw-created native lifetimes and disposal, not this type member.
   */
  render: (scene: THREE.Scene, camera: THREE.Camera) => void;

  /** Canvas-like element owned by the renderer. */
  domElement: {
    /** Current physical canvas pixel width after the original draw. */
    width: number;

    /** Current physical canvas pixel height after the original draw. */
    height: number;

    /** Original synchronous canvas encoder; native fallback/failure is preserved. */
    toDataURL: (type?: string, quality?: number) => string;
  };
}
