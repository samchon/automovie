import type * as THREE from "three";

/**
 * Original synchronous draw and canvas readout required by the low-level
 * snapshot adapter. A real WebGLRenderer satisfies this shape, but structural
 * compatibility alone cannot establish native pixels, hardware or source
 * validity. The caller owns the live matching canvas/renderer and its
 * shutdown.
 */
export interface IAutoMovieViewerSnapshotRenderer {
  /** Render the scene from the camera before the canvas is read. */
  render: (scene: THREE.Scene, camera: THREE.Camera) => void;

  /** Canvas-like element owned by the renderer. */
  domElement: {
    /** Current physical canvas pixel width after the original draw. */
    width: number;

    /** Current physical canvas pixel height after the original draw. */
    height: number;

    /**
     * Original synchronous canvas encoder; native fallback/failure is
     * preserved.
     */
    toDataURL: (type?: string, quality?: number) => string;
  };
}
