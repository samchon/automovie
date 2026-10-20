import type * as THREE from "three";

/**
 * Original synchronous draw and canvas readout required by the low-level snapshot adapter. A real WebGLRenderer satisfies this shape, but structural compatibility alone cannot establish native pixels, hardware or source validity. The caller owns the live matching canvas/renderer and its shutdown.
 *
 * @evidence contracts/common.md#principled-implementation Defines the original synchronous scene/camera draw and canvas extent/encoding operations required by the low-level snapshot adapter.
 * @evidence contracts/common.md#clear-and-simple-design A small structural host boundary avoids importing browser-global acquisition into the capture function while native host ownership stays explicit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shape compatibility, a data URL or a fake implementation cannot prove an actual renderer, completed pixels, current source or hardware readiness; the host must supply its genuine draw/encoder when those claims are needed.
 * @evidence contracts/common.md#meaningful-documentation Documents draw-before-read, physical canvas extent and original encoder fallback/failure responsibility.
 * @evidence contracts/performance.md#efficient-algorithms The interface stores host operations and canvas values only; actual native draw and image encoding dominate capture cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Borrowed host operations may be reused across live frames, but each requested capture executes a fresh original draw/encode rather than reusing equal metadata.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The type acquires no renderer/context/canvas owner and exposes no disposer; its caller keeps the host live and retires native resources outside snapshot readout.
 */
export interface IAutoMovieViewerSnapshotRenderer {
  /**
   * Render the scene from the camera before the canvas is read.
   *
   * @evidence contracts/common.md#principled-implementation Invokes the supplied original scene/camera drawing operation synchronously before its own canvas is encoded.
   * @evidence contracts/common.md#clear-and-simple-design Draw ownership remains with the concrete host while capture coordinates ordering only.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An asynchronous or invented draw cannot certify completed pixels through this void boundary; genuine live renderer and matching canvas are caller premises.
   * @evidence contracts/common.md#meaningful-documentation Documents original draw responsibility, scene/camera borrowing and draw-before-read ordering.
   * @evidence contracts/performance.md#efficient-algorithms Actual native scene/render cost belongs to the host, with no extra scene traversal imposed by this callable contract.
   * @evidence contracts/performance.md#reuse-equivalent-work Every requested capture owns a fresh draw effect; equal scene/camera object identities do not permit skipping a changed frame.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Scene/camera are borrowed and the host owns all draw-created native lifetimes and disposal, not this type member.
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
