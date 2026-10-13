import type * as THREE from "three";

/**
 * Result of building a scene: the `three.js` scene, its cameras (first is
 * default), and its lights indexed by id.
 *
 * @author Samchon
 */
export interface IAutoMovieSceneObject {
  /**
   * Viewer-built scene whose leading children retain the compiled node order.
   */
  scene: THREE.Scene;

  /** Perspective cameras in declared order; the first is the host's default. */
  cameras: THREE.PerspectiveCamera[];

  /**
   * Built lights keyed by their {@link IAutoMovieLight.id}, the index
   * {@link applyLightMotion} resolves a shot's `lightMotions` against. Keyed by
   * id rather than handed back positionally: the scene's own child order is
   * load-bearing for the mask palette, so a light must never be found by
   * counting.
   */
  lights: Map<string, THREE.Light>;
}
