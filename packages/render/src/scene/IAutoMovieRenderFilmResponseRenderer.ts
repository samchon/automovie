import type * as THREE from "three";

/**
 * The part of `THREE.WebGLRenderer` the film response stage drives: drawing,
 * the current target, the renderer's own curve and exposure it holds neutral,
 * the clear policy and shadow-map updates.
 *
 * Structural so the stage's ordering and state restoration are checkable with a
 * recording renderer; the real renderer satisfies it as it stands.
 */
export interface IAutoMovieRenderFilmResponseRenderer {
  /** Draw a scene through a camera into the current target. */
  render(scene: THREE.Object3D, camera: THREE.Camera): void;

  /** The target drawn into now; null is the canvas. */
  getRenderTarget(): THREE.WebGLRenderTarget | null;

  /** Draw into a target, or the canvas when null. */
  setRenderTarget(target: THREE.WebGLRenderTarget | null): void;

  /**
   * The renderer's own tone curve, which it applies only when drawing to the
   * canvas.
   */
  toneMapping: THREE.ToneMapping;

  /** The renderer's own exposure multiplier for that curve. */
  toneMappingExposure: number;

  /** Whether each `render` clears its target first. */
  autoClear: boolean;

  /**
   * Shadow-map policy: automatic updates are read and set, and whether shadow
   * maps are drawn at all is read by the medium pass.
   */
  shadowMap: {
    /** Whether each `render` redraws the shadow maps. */
    autoUpdate: boolean;

    /**
     * Whether the renderer draws shadow maps; absent reads as false, so a
     * medium marches without shadows.
     */
    enabled?: boolean;
  };
}
