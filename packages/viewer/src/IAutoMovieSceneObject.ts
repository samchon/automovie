import type * as THREE from "three";

/**
 * Result of building a scene: the `three.js` scene, its cameras (first is
 * default), and its lights indexed by id.
 *
 * @evidence requirements/staging/scope-and-source-of-truth.md#staging-resolved-scene-state Materializes this surface from the resolved scene state only.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Implements the boundary from resolved staging state to the viewer scene.
 * @author Samchon
 */
export interface IAutoMovieSceneObject {
  /**
   * Viewer-built scene whose leading children retain the compiled node order.
   *
   * @evidence requirements/staging/scope-and-source-of-truth.md#staging-resolved-scene-state Materializes this surface from the resolved scene state only.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Implements the boundary from resolved staging state to the viewer scene.
   */
  scene: THREE.Scene;

  /**
   * Perspective cameras in declared order; the first is the host's default.
   *
   * @evidence requirements/camera/projection-lens-and-sensor.md#camera-focal-fov Materializes the resolved vertical field of view as the perspective-camera basis.
   * @evidence specifications/camera-light-and-visibility/camera-state-projection-and-gate.md#clv-lens-basis-consistency Implements that authored field-of-view basis in the runtime camera.
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Materializes the resolved ordered near and far clipping distances.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Implements those clipping distances, and only those, on the runtime camera used for evaluation; an authored camera declares no section plane, which `applyAutoMovieSectionPlanes` applies to materials for inspection instead.
   */
  cameras: THREE.PerspectiveCamera[];

  /**
   * Built lights keyed by their {@link IAutoMovieLight.id}, the index
   * {@link applyLightMotion} resolves a shot's `lightMotions` against. Keyed by
   * id rather than handed back positionally: the scene's own child order is
   * load-bearing for the mask palette, so a light must never be found by
   * counting.
   *
   * @evidence requirements/lighting/sources-and-photometry.md#lighting-source-distribution Materializes each resolved light kind, direction, cone, and range.
   * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-source-distribution-color Implements the runtime source distribution and color mapping.
   */
  lights: Map<string, THREE.Light>;
}
