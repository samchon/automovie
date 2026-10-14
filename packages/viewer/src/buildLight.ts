import type { IAutoMovieLight } from "@automovie/interface";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

import { applyLightState } from "./applyLightState.js";

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
 * @evidence contracts/common.md#principled-implementation Chooses native point/area/directional/spot classes from the admitted kind, applies the shared absolute state writer, installs supported shadow camera fields and aims directional/spot targets one metre along local -Z as children; admitted transforms/shadow ranges and the stage's -Z forward convention are premises.
 * @evidence contracts/common.md#clear-and-simple-design Class/aim/shadow construction is local to this producer while applyLightState owns build/frame field mapping; area lights initialize the native shared BRDF lookup library once rather than requiring each host to know that native prerequisite.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses authored kind/direction/shadow declaration with no fixture light or browser substitution; the native area lookup initializer is supported global library setup, not replacing a global method. Its installed flag precedes init and does not recover an initializer throw.
 * @evidence contracts/common.md#meaningful-documentation States class mapping, shared placement writer, parented aim target and area lookup prerequisite; caller owns returned light/any subsequently allocated native shadow product.
 * @evidence contracts/performance.md#efficient-algorithms Builds one fixed-size light and at most one existing target attachment, constant adapter work; first area-light initialization creates native LUT state once, while actual shadow maps/draw cost belongs to renderer use.
 * @evidence contracts/performance.md#reuse-equivalent-work Static builds and light-motion frames use one field writer; all area lights share process/module lookup tables via the installed flag, with no per-light texture rebuild.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Transfers returned light/child target to the scene host; no render loop or worker is created. Native area LUT global state persists for the module lifetime without a local release API, and actual rendered shadow maps must be retired by their renderer/light owner.
 */
export const buildLight: (light: IAutoMovieLight) => THREE.Light = (
  light: IAutoMovieLight,
): THREE.Light => {
  if (light.type === "point") {
    const built: THREE.PointLight = new THREE.PointLight();
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
    const built: THREE.RectAreaLight = new THREE.RectAreaLight(
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
  const built: THREE.DirectionalLight | THREE.SpotLight =
    light.type === "directional"
      ? new THREE.DirectionalLight()
      : new THREE.SpotLight();
  applyLightState(built, light);
  applyShadow(built, light);
  return aimLight(built);
};

let rectAreaLightUniformsInstalled: boolean = false;

/** Install the `RectAreaLight` BRDF lookup tables exactly once per process. */
const initRectAreaLightUniforms: () => void = (): void => {
  if (rectAreaLightUniformsInstalled) return;
  rectAreaLightUniformsInstalled = true;
  RectAreaLightUniformsLib.init();
};

const applyShadow: (built: THREE.Light, light: IAutoMovieLight) => void = (
  built: THREE.Light,
  light: IAutoMovieLight,
): void => {
  built.castShadow = light.castShadow ?? false;
  if (light.shadow === undefined || !("shadow" in built)) return;
  const shadow:
    | THREE.SpotLightShadow
    | THREE.DirectionalLightShadow
    | THREE.PointLightShadow = (
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
const aimLight: <Light extends THREE.DirectionalLight | THREE.SpotLight>(
  light: Light,
) => Light = <Light extends THREE.DirectionalLight | THREE.SpotLight>(
  light: Light,
): Light => {
  light.target.position.set(0, 0, -1);
  light.add(light.target);
  return light;
};
