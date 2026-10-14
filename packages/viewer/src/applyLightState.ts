import type { IAutoMovieLight } from "@automovie/interface";
import * as THREE from "three";

import { applyTransform } from "./applyTransform.js";

/**
 * Write one {@link IAutoMovieLight}'s value onto the `three.js` light that plays
 * it: its PLACEMENT for every kind, colour and intensity for every kind,
 * falloff distance for the two that have one, the cone half-angle (degrees on
 * the artifact, radians in `three.js`) for a spot, and the panel extent for an
 * area source.
 *
 * The one place the mapping lives. {@link buildLight} calls it to place a staged
 * light and {@link applyLightMotion} calls it to move that same light over time,
 * so an animated light and a static one can never disagree about what `range`
 * or `coneAngle` means.
 *
 * The transform is written HERE rather than once at build time, which is what
 * makes a light's direction animatable at all. `buildLight` used to place the
 * light itself and this helper wrote everything except its placement, so a
 * `/lights/<id>/rotation` track could resolve to a new orientation every frame
 * and the `three.js` light would keep the one it was staged with forever. Both
 * callers now go through one writer, so the rendered placement is the resolved
 * placement by construction; {@link aimLight} keeps the light's target as a
 * CHILD for exactly the same reason, so a turning light turns what it aims at
 * with it.
 *
 * Writing an absolute TRS every frame is also what lets `applyLightMotion` keep
 * its promise that the viewer's lighting is a pure function of scene, clips and
 * time: a light nothing addresses is written back to where the scene staged it
 * rather than holding wherever the previous frame left it.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Maps admitted TRS, linear RGB/intensity, point/spot range, degree cone half-angle to radians and area metre extent to Three fields; target class must match the authored kind for kind-specific properties, while this writer neither reconstructs aim children nor updates shadow configuration.
 * @evidence contracts/common.md#clear-and-simple-design Owns the same field conversion for buildLight and absolute frame writes; existing applyTransform owns quaternion/TRS realization and buildLight owns class/aim/shadow acquisition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads authored/resolved values without time/id-specific substitutions or renderer monkeypatches; class guards limit which real Three properties are touched, rather than coercing an incompatible host object.
 * @evidence contracts/common.md#meaningful-documentation States supported light properties, angular units, shared build/frame writer, absolute placement and the aim-child dependency.
 * @evidence contracts/performance.md#efficient-algorithms Performs a fixed-size TRS/color update and at most one kind branch, constant CPU time/storage independent of scene population or shadow raster size.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the same conversion for static construction and motion; it writes current absolute values each call because an unchanged declaration does not prove a mutable target still holds them.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows target/declaration and allocates no light, material, shadow map or task; no references survive the call beyond fields already owned by the target.
 */
export const applyLightState: (
  target: THREE.Light,
  light: IAutoMovieLight,
) => void = (target: THREE.Light, light: IAutoMovieLight): void => {
  applyTransform(target, light.transform);
  target.color.setRGB(light.color.r, light.color.g, light.color.b);
  target.intensity = light.intensity;
  if (light.type === "point" && target instanceof THREE.PointLight)
    target.distance = light.range;
  else if (light.type === "spot" && target instanceof THREE.SpotLight) {
    target.distance = light.range;
    target.angle = (light.coneAngle * Math.PI) / 180;
  } else if (light.type === "area" && target instanceof THREE.RectAreaLight) {
    // Extent carries no channel, so it never changes between frames; it is
    // written here anyway because this is the one place a light's values are
    // mapped, and a second writer at build time is the duplicate that survives
    // until the two copies disagree.
    target.width = light.width;
    target.height = light.height;
  }
};
