import type { IAutoMovieFog } from "@automovie/interface";
import * as THREE from "three";

/**
 * Put the scene's declared atmosphere on a `three.js` scene, or clear it when
 * nothing is declared.
 *
 * `FogExp2` is the exact law {@link IAutoMovieFog} documents and
 * {@link sceneFogTransmittance} reproduces on the CPU: the shader's `1 -
 * exp(-(density * depth)^2)` mix toward `color`. Nothing is converted on the
 * way in. `density` is handed over verbatim, and the color is written with
 * `setRGB` on the working (linear) color space, the same call
 * {@link applyLightState} makes for a light, because `IAutoMovieColor` is linear
 * by contract and a second convention here would make the fog and the key light
 * disagree about what `0.5` means.
 *
 * Exported, and separate from {@link buildScene}, for the reason `buildLight`
 * is: a host that assembles its own scene graph (the playground's film page,
 * which is what the offline renderer captures) must apply the FILM's atmosphere
 * through this one call rather than decorating its page with fog of its own. A
 * page that fogs itself proves nothing about the production.
 *
 * Absent or `null` clears `scene.fog`, which is `three.js`'s own "no fog":
 * every material compiles without `USE_FOG` and the frame is byte-identical to
 * one rendered before the field existed.
 *
 * @evidence requirements/lighting/sun-sky-and-environment.md#lighting-environment-time-sampling Applies the resolved fog state sampled with the scene's light, material, and camera state.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-environment-sampling-claims Materializes that sampled environment attenuation without inventing weather or atmosphere state.
 */
export const applySceneFog = (
  scene: THREE.Scene,
  fog: IAutoMovieFog | null | undefined,
): void => {
  if (fog === null || fog === undefined) {
    scene.fog = null;
    return;
  }
  const built = new THREE.FogExp2(0x000000, fog.density);
  built.color.setRGB(fog.color.r, fog.color.g, fog.color.b);
  scene.fog = built;
};
