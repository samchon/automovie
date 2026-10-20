import type * as THREE from "three";

/**
 * Result of building a scene: the `three.js` scene, its cameras (first is
 * default), and its lights indexed by id.
 *
 * @evidence contracts/common.md#principled-implementation Keeps the built scene with ordered cameras and an id-keyed light map; leading node-child order preserves mask addressing while light motion resolves semantic ids independently of child position.
 * @evidence contracts/common.md#clear-and-simple-design Scene mounting, default camera selection and light animation each receive the lookup form their existing consumer needs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lights are never found by counting scene children, and authored camera order remains intact rather than selecting a preferred fixture camera.
 * @evidence contracts/common.md#meaningful-documentation Documents leading compiled node order, first-camera default and id-based light animation lookup rationale.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The built-scene record runs no node construction or light lookup strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work References expose one existing built scene and do not coordinate repeated construction requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scene builders and hosts own contained resource lifetimes; returning this record acquires no additional renderer or render loop.
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
