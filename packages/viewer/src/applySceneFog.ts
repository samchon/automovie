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
 * fog-capable materials stop receiving the fog term. That omission says nothing
 * about other render state or byte-for-byte frame equality.
 *
 * @evidence contracts/common.md#principled-implementation Realizes the declared exp(-(density*viewDepth)^2) transmittance with Three FogExp2 and linear RGB, relying on finite admitted density/color and the material's native fog chunks; null/omission clears atmosphere rather than creating a default fog.
 * @evidence contracts/common.md#clear-and-simple-design One scene-field adapter is shared by buildScene and hosts that assemble their own graph; portable fog law/admission stay in the engine/interface and guide suspension stays at applyRenderMode.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the authored linear color/density without fixture distances, image-space compensation or replacement material/global methods.
 * @evidence contracts/common.md#meaningful-documentation States the exponential law, linear color convention, shared producer entry and null/omission meaning without claiming unrelated frame equality.
 * @evidence contracts/performance.md#efficient-algorithms Allocates one fixed-size FogExp2 value and writes three color channels, constant installation cost; native fragment fog work belongs to rendering rather than a CPU scene scan.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses Three's native fog implementation and the shared adapter; changed fog can replace the scalar object cheaply, with no geometry/cache rebuild or cross-scene state sharing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Transfers one scalar/color fog object to the scene and releases its previous reference on assignment/clear; no GPU handle, observer or task is owned here.
 */
export const applySceneFog: (
  scene: THREE.Scene,
  fog: IAutoMovieFog | null | undefined,
) => void = (
  scene: THREE.Scene,
  fog: IAutoMovieFog | null | undefined,
): void => {
  if (fog === null || fog === undefined) {
    scene.fog = null;
    return;
  }
  const built: THREE.FogExp2 = new THREE.FogExp2(0x000000, fog.density);
  built.color.setRGB(fog.color.r, fog.color.g, fog.color.b);
  scene.fog = built;
};
