import type { IAutoMovieLight } from "@automovie/interface";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { applyLightState } from "./applyLightState";

/**
 * Build the `three.js` light one staged light plays on, aimed the way the
 * artifact says. The kind decides the class; every value INCLUDING the
 * placement is written by {@link applyLightState}, the same call a shot's
 * `lightMotions` uses each frame, so placing a light and animating it cannot
 * map `range`, `coneAngle` or the transform two different ways; the two aimed
 * kinds then get their target ({@link aimLight}), which is the half of a light's
 * placement `three.js` does not read off a quaternion.
 *
 * The placement is deliberately NOT applied a second time here. It used to be,
 * back when `applyLightState` wrote everything except the transform; now that
 * one writer owns the whole light, repeating the call would be a second
 * statement of the same fact, and the kind of duplicate that survives right up
 * until the two copies disagree.
 *
 * Exported because a host that assembles its own scene graph (the playground's
 * film page) must light it from `scene.lights` rather than from a hardcoded
 * source of its own: a page that lights itself proves nothing about the film's
 * lighting, which is how the aim defect in #1356 survived every capture.
 *
 * @evidence requirements/lighting/sources-and-photometry.md#lighting-source-distribution Materializes each resolved light kind, direction, cone, and range.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-source-distribution-color Implements the runtime source distribution and color mapping.
 * @evidence requirements/lighting/shadows-reflections-and-transmission.md#lighting-shadow-identity Materializes the declared shadow source, map, bias, and clipping identity.
 * @evidence specifications/camera-light-and-visibility/light-transport-color-and-budget.md#clv-shadow-state-sampling Implements that shadow state on the runtime light.
 */
export const buildLight = (light: IAutoMovieLight): THREE.Light => {
  if (light.type === "point") {
    const built = new THREE.PointLight();
    applyLightState(built, light);
    applyShadow(built, light);
    return built;
  }
  if (light.type === "area") {
    // A `RectAreaLight` shades through a lookup texture pair the core bundle
    // does not install, and an uninitialized one lights nothing at all. The
    // install is global renderer state, so it happens once, here, where the
    // first panel is built: a host that stages no area light pays nothing, and
    // one that stages ten cannot forget.
    initRectAreaLightUniforms();
    const built = new THREE.RectAreaLight(
      undefined,
      undefined,
      light.width,
      light.height,
    );
    applyLightState(built, light);
    // No `aimLight`: a `RectAreaLight` has no target object and emits from the
    // face its own local −Z points at, which is already the forward axis
    // `stageScene` rotated onto the authored direction.
    return built;
  }
  const built =
    light.type === "directional"
      ? new THREE.DirectionalLight()
      : new THREE.SpotLight();
  applyLightState(built, light);
  applyShadow(built, light);
  return aimLight(built);
};

let rectAreaLightUniformsInstalled = false;

/** Install the `RectAreaLight` BRDF lookup tables exactly once per process. */
const initRectAreaLightUniforms = (): void => {
  if (rectAreaLightUniformsInstalled) return;
  rectAreaLightUniformsInstalled = true;
  RectAreaLightUniformsLib.init();
};

const applyShadow = (built: THREE.Light, light: IAutoMovieLight): void => {
  built.castShadow = light.castShadow ?? false;
  if (light.shadow === undefined || !("shadow" in built)) return;
  const shadow = (
    built as THREE.PointLight | THREE.SpotLight | THREE.DirectionalLight
  ).shadow;
  shadow.mapSize.set(light.shadow.mapSize, light.shadow.mapSize);
  shadow.bias = light.shadow.bias;
  shadow.normalBias = light.shadow.normalBias;
  shadow.camera.near = light.shadow.near;
  shadow.camera.far = light.shadow.far;
  shadow.camera.updateProjectionMatrix();
};

/**
 * Point an aimed light along the direction its transform carries.
 *
 * `stage` requires a `direction` for the aimed kinds and lowers it into the
 * scene light's `transform.rotation` ({@link IAutoMovieLight}: "for directional
 * light only the orientation matters"), but `three.js` does not shine a
 * `DirectionalLight`/`SpotLight` along its quaternion: it shines from its
 * position toward its `target`, which defaults to a fresh object at the world
 * origin. Writing the transform alone therefore threw the whole authored
 * direction away, and a staged directional light (whose lowering puts it at the
 * origin, since only its orientation means anything) came out shining along the
 * ZERO vector while a spot silently aimed at the origin from wherever it stood
 * (#1356).
 *
 * Parenting the target to the light is what keeps one source of truth: the
 * target sits one meter down the light's local −Z, the same forward axis
 * `stageScene` aimed, so the rendered direction IS the artifact's rotation and
 * no second field can drift from it. `three.js` only reads a target that is in
 * the scene graph, and a child of the light always is.
 */
const aimLight = <Light extends THREE.DirectionalLight | THREE.SpotLight>(
  light: Light,
): Light => {
  light.target.position.set(0, 0, -1);
  light.add(light.target);
  return light;
};
